// Browser smoke tests: real React form and Firebase SDK, simulated external services.
// Run with: node tests/auth-browser.mjs
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "@playwright/test";

const phone = "+447700900123";
const scenarios = [
  {
    label: "local development",
    origin: "http://localhost:3000",
    environment: "development",
    useTestPhoneAuth: true,
  },
  {
    label: "production",
    origin: "https://auth.example.test",
    environment: "production",
    useTestPhoneAuth: false,
  },
];
const jwt = ["header", Buffer.from(JSON.stringify({
  sub: "test-user", aud: "test-project", iss: "https://securetoken.google.com/test-project",
  iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600,
  auth_time: Math.floor(Date.now() / 1000), phone_number: phone,
  firebase: { sign_in_provider: "phone" },
})).toString("base64url"), "test-signature"].join(".");

const browser = await chromium.launch({ headless: true });
try {
  for (const scenario of scenarios) {
    const { environment, origin, useTestPhoneAuth } = scenario;
    const bundle = await build({
      stdin: {
        contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
          import {CustomerLoginForm} from './src/app/(storefront)/login/CustomerLoginForm';
          createRoot(document.getElementById('root')).render(<CustomerLoginForm next='/account/orders' />);`,
        resolveDir: process.cwd(), loader: "tsx",
      },
      bundle: true, write: false, platform: "browser", jsx: "automatic",
      define: {
        "process.env.NODE_ENV": JSON.stringify(environment),
        "process.env.NEXT_PUBLIC_FIREBASE_USE_TEST_PHONE_AUTH": JSON.stringify(String(useTestPhoneAuth)),
      },
      plugins: [{ name: "external-service-boundaries", setup(builder) {
        const replacements = {
          "next/navigation": `export const useRouter=()=>({replace:path=>location.assign(path),refresh:()=>{}}); export const unstable_rethrow=()=>{};`,
          "@/lib/firebase/client": `import {initializeApp} from 'firebase/app'; import {getAuth} from 'firebase/auth';
            const app=initializeApp({apiKey:'test-api-key',authDomain:'test-project.firebaseapp.com',projectId:'test-project',appId:'test-app'});
            export const getFirebaseAuth=()=>getAuth(app);`,
          "./actions": `const action=async(name,data)=>{const response=await fetch('/test-email/'+name,{method:'POST',body:JSON.stringify(Object.fromEntries(data))});
            const result=await response.json(); if(result.redirectTo)location.assign(result.redirectTo); return result;};
            export const requestLoginOtp=data=>action('request-login',data); export const requestSignupOtp=data=>action('request-signup',data);
            export const verifyLoginOtp=data=>action('verify-login',data); export const verifySignupOtp=data=>action('verify-signup',data);
            export const resetPassword=data=>action('reset',data);`,
        };
        builder.onResolve({ filter: /^(next\/navigation|@\/lib\/firebase\/client|\.\/actions)$/ }, args => ({ path: args.path, namespace: "test-boundary" }));
        builder.onLoad({ filter: /.*/, namespace: "test-boundary" }, args => ({ contents: replacements[args.path], resolveDir: process.cwd() }));
      } }],
    });
    for (const channel of ["phone", "email"]) {
      for (const mode of ["login", "signup"]) {
        const context = await browser.newContext();
        const page = await context.newPage();
        const calls = [];
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.addInitScript(() => {
          const widgets = [];
          window.grecaptcha = {
            render(container, parameters) {
              // Model Google's automatic click binding when the host is a button.
              if (container instanceof HTMLButtonElement) container.addEventListener("click", event => event.preventDefault());
              widgets.push(parameters);
              return widgets.length - 1;
            },
            execute(id) { widgets[id].callback("test-recaptcha-token"); },
            getResponse() { return ""; }, reset() {},
          };
        });
        await page.route("**/*", async route => {
          const request = route.request();
          const url = new URL(request.url());
          const json = body => route.fulfill({ json: body });
          if (url.origin === origin && url.pathname === "/login") return route.fulfill({ contentType: "text/html", body: '<div id="root"></div><script src="/form.js"></script>' });
          if (url.origin === origin && url.pathname === "/form.js") return route.fulfill({ contentType: "application/javascript", body: bundle.outputFiles[0].text });
          if (url.pathname === "/account/orders") return route.fulfill({ contentType: "text/html", body: "Authenticated destination" });
          if (url.pathname === "/api/customer/phone-status") return json({ ok: true, status: mode === "login" ? "active" : "missing" });
          if (url.pathname === "/api/customer/firebase-phone-login") {
            const body = request.postDataJSON();
            calls.push("phone-session");
            assert.equal(body.idToken, jwt);
            assert.equal(body.allowCreate, mode === "signup");
            if (mode === "signup") assert.equal(body.fullName, "Test Customer");
            return json({ ok: true, redirectTo: "/account/orders" });
          }
          if (url.pathname.startsWith("/test-email/")) {
            const body = request.postDataJSON();
            calls.push(url.pathname.split("/").at(-1));
            assert.equal(body.email, "customer@example.com");
            if (url.pathname.includes("request")) return json({ ok: true, challengeId: "email-challenge" });
            assert.equal(body.code, "123456");
            assert.equal(body.challengeId, "email-challenge");
            return json({ ok: true, redirectTo: "/account/orders" });
          }
          if (url.hostname === "identitytoolkit.googleapis.com") {
            if (url.pathname.endsWith("recaptchaConfig")) return json({ recaptchaEnforcementState: [] });
            if (url.pathname.endsWith("recaptchaParams")) return json({ recaptchaSiteKey: "test-site-key" });
            if (url.pathname.endsWith("accounts:sendVerificationCode")) {
              calls.push("sms");
              assert.equal(request.postDataJSON().phoneNumber, phone);
              assert.equal(request.postDataJSON().recaptchaToken, "test-recaptcha-token");
              return json({ sessionInfo: "test-session" });
            }
            if (url.pathname.endsWith("accounts:signInWithPhoneNumber")) {
              calls.push("confirm");
              assert.equal(request.postDataJSON().code, "123456");
              return json({ idToken: jwt, refreshToken: "test-refresh", expiresIn: "3600", localId: "test-user", phoneNumber: phone });
            }
            if (url.pathname.endsWith("accounts:lookup")) return json({ users: [{ localId: "test-user", phoneNumber: phone, providerUserInfo: [{ providerId: "phone", rawId: phone, phoneNumber: phone }] }] });
          }
          if (url.hostname === "securetoken.googleapis.com") {
            calls.push("id-token");
            return json({ access_token: jwt, id_token: jwt, refresh_token: "test-refresh", expires_in: "3600", user_id: "test-user" });
          }
          return route.abort();
        });
        try {
          await page.goto(`${origin}/login`);
          if (mode === "signup") {
            await page.getByRole("button", { name: "REGISTER", exact: true }).click();
            await page.getByPlaceholder("Enter your full name").fill("Test Customer");
          }
          await page.getByPlaceholder("Enter your email or phone number").fill(channel === "phone" ? phone : "customer@example.com");
          await page.getByRole("button", { name: mode === "login" ? "SEND LOGIN OTP" : "SEND CODE", exact: true }).click();
          await page.getByPlaceholder("6-digit code").fill("123456");
          await page.getByRole("button", { name: mode === "login" ? "VERIFY & LOGIN" : "VERIFY & CREATE ACCOUNT", exact: true }).click();
          await page.waitForURL(`${origin}/account/orders`);
          assert.deepEqual(errors, []);
          assert.deepEqual(calls, channel === "phone" ? ["sms", "confirm", "id-token", "phone-session"] : [`request-${mode}`, `verify-${mode}`]);
          console.log(`PASS ${scenario.label}: ${channel} ${mode}`);
        } catch (error) {
          console.log({ scenario: scenario.label, channel, mode, calls, errors, alert: await page.getByRole("alert").allTextContents() });
          throw error;
        } finally { await context.close(); }
      }
    }
  }
} finally { await browser.close(); }

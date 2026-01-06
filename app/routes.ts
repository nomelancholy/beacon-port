import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("common/home.tsx"),
  route("login", "features/auth/pages/login.tsx"),
  route("signup", "features/auth/pages/signup.tsx"),
  route("auth/callback", "features/auth/pages/auth-callback.tsx"),
  route("profile", "features/auth/pages/profile.tsx"),
  route("my-resume", "features/resume/pages/my-resume.tsx"),
  route("add-resume", "features/resume/pages/add-resume.tsx"),
  route("resume/:id", "features/resume/pages/resume-detail.tsx"),
] satisfies RouteConfig;

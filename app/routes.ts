import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("my-resume", "routes/my-resume.tsx"),
  route("add-resume", "routes/add-resume.tsx"),
] satisfies RouteConfig;

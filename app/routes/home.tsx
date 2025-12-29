import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Globe } from "../components/ui/globe";
import { TypingAnimation } from "../components/ui/typing-animation";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "../components/ui/navigation-menu";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Beacon Port" },
    {
      name: "description",
      content:
        "인재의 신호가 모이는 곳. Beacon Port에서 당신의 다음 팀원을 발견하세요",
    },
  ];
}

export default function Home() {
  return (
    <div className="w-full">
      {/* Navigation Menu */}
      <nav className="fixed top-0 right-0 z-50 p-4">
        <NavigationMenu>
          <NavigationMenuList className="flex gap-4">
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={`${navigationMenuTriggerStyle()} text-white hover:text-white/80`}
              >
                <Link to="/explore">둘러보기</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={`${navigationMenuTriggerStyle()} text-white hover:text-white/80`}
              >
                <Link to="/login">로그인/회원가입</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </nav>

      {/* Content Section - Below Image */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4 py-20">
        {/* Text Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            인재의 신호가 모이는 곳
          </h1>
          <p className="text-xl text-white/90 md:text-2xl lg:text-3xl">
            Beacon Port에서 당신의 다음 팀원을 발견하세요
          </p>
        </div>

        {/* Globe Component */}
        <div
          className="relative flex w-full max-w-4xl items-center justify-center"
          style={{ minHeight: "600px" }}
        >
          <Globe className="relative" />
        </div>
      </div>

      {/* Typing Animation - Bottom */}
      <div className="relative z-20 flex  items-center justify-center bg-gray-900 pb-16">
        <TypingAnimation
          className="text-4xl font-bold text-white md:text-5xl lg:text-6xl"
          loop={false}
          blinkCursor={true}
          showCursor={true}
          startOnView={false}
        >
          BEACON PORT
        </TypingAnimation>
      </div>
    </div>
  );
}

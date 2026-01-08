import type { Route } from "./+types/home";
import { Link } from "react-router";
import { Globe } from "../components/ui/globe";
import { TypingAnimation } from "../components/ui/typing-animation";
import { InteractiveGridPattern } from "../components/ui/interactive-grid-pattern";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "../components/ui/navigation-menu";
import { createSupabaseServerClient } from "~/supabase/server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Beacon Port" },
    {
      name: "description",
      content: "인재의 신호가 모이는 곳. 지금 당신의 Beacon을 켜세요",
    },
  ];
}

export const loader = async ({ request }: Route.LoaderArgs) => {
  const supabase = createSupabaseServerClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { isAuthenticated: !!user };
};

export default function Home({ loaderData }: Route.ComponentProps) {
  const { isAuthenticated } = loaderData;
  return (
    <div className="w-full">
      {/* Navigation Menu */}
      <nav className="fixed top-0 right-0 z-50 p-4">
        <NavigationMenu>
          <NavigationMenuList className="flex gap-4">
            {/* TODO: 둘러보기 기능 추가 */}
            {/* <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={`${navigationMenuTriggerStyle()} text-white hover:text-white/80`}
              >
                <Link to="/explore">둘러보기</Link>
              </NavigationMenuLink>
            </NavigationMenuItem> */}
            {isAuthenticated ? (
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} text-white hover:text-white/80`}
                >
                  <Link to="/my-resume">나의 이력서</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ) : (
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} text-white hover:text-white/80`}
                >
                  <Link to="/login">로그인/회원가입</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </nav>

      {/* Content Section - Below Image */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4 py-4 md:py-8 lg:py-10">
        {/* Text Section */}
        <div className="mb-2 md:mb-4 text-center px-2">
          <h1 className="mb-2 md:mb-4 text-2xl font-bold text-white sm:text-3xl md:text-5xl lg:text-6xl whitespace-nowrap">
            인재의 신호가 모이는 곳
          </h1>
          <p className="text-base text-white/90 sm:text-lg md:text-2xl lg:text-3xl">
            지금 당신의 Beacon을 켜세요
          </p>
        </div>

        {/* Globe Component */}
        <div
          className="relative flex w-full max-w-4xl items-center justify-center overflow-hidden"
          style={{ minHeight: "clamp(400px, 60vh, 850px)" }}
        >
          <InteractiveGridPattern
            className={cn(
              "z-0",
              "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
              "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12"
            )}
            width={40}
            height={40}
            squares={[24, 24]}
            squaresClassName="hover:fill-white/20"
          />
          <Globe className="relative z-10" />
        </div>
      </div>

      {/* Typing Animation - Bottom */}
      <div className="relative z-20 flex items-center justify-center bg-gray-900 pb-8 md:pb-12 lg:pb-16">
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

import * as React from "react";
import type { Route } from "./+types/my-resume";
import { Link, useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "나의 이력서 - Beacon Port" },
    {
      name: "description",
      content: "나의 이력서를 관리하세요",
    },
  ];
}

// 임시 데이터 (나중에 실제 데이터로 교체)
const mockResumes = [
  {
    id: 1,
    title: "프론트엔드 개발자 이력서",
    updatedAt: "2024-01-15",
    status: "공개",
  },
  {
    id: 2,
    title: "풀스택 개발자 이력서",
    updatedAt: "2024-01-10",
    status: "비공개",
  },
];

export default function MyResume() {
  const navigate = useNavigate();

  const handleAddResume = () => {
    navigate("/add-resume");
  };

  const handleResumeClick = (id: number) => {
    // TODO: 이력서 상세 페이지로 이동
    console.log("View/Edit resume:", id);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-900">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">나의 이력서</h1>
            <Button
              onClick={handleAddResume}
              className="gap-2 text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              이력서 추가
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {mockResumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="mb-4 text-lg text-white/90">
              등록된 이력서가 없습니다
            </p>
            <Button
              onClick={handleAddResume}
              className="gap-2 text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />첫 이력서 추가하기
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockResumes.map((resume) => (
              <Card
                key={resume.id}
                className="cursor-pointer border-gray-700 bg-gray-800 hover:border-gray-600 hover:shadow-lg transition-all"
                onClick={() => handleResumeClick(resume.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-white">
                        {resume.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-white/70">
                        최종 수정: {resume.updatedAt}
                      </CardDescription>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        resume.status === "공개"
                          ? "bg-green-900/50 text-green-300"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {resume.status}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

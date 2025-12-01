import { Button, Card, Space } from "antd";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-8">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8">
        <Card className="w-full">
          <Space orientation="vertical" size="large" className="w-full">
            <h1 className="text-3xl font-semibold text-center">
              LSSGOO Dashboard
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400">
              Your Next.js app is set up with:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>✅ Prisma with PostgreSQL</li>
              <li>✅ Ant Design (antd)</li>
              <li>✅ Tailwind CSS</li>
              <li>✅ TypeScript</li>
            </ul>
            <Space>
              <Button type="primary">Get Started</Button>
              <Button>Learn More</Button>
            </Space>
          </Space>
        </Card>
      </main>
    </div>
  );
}

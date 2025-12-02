'use client';

import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/auth/use-auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  KeyOutlined,
  HistoryOutlined,
  FileTextOutlined,
  LogoutOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard/users',
      icon: <TeamOutlined />,
      label: 'Users',
    },
    {
      key: '/dashboard/roles',
      icon: <SafetyOutlined />,
      label: 'Roles',
    },
    {
      key: '/dashboard/permissions',
      icon: <KeyOutlined />,
      label: 'Permissions',
    },
    {
      key: '/dashboard/sessions',
      icon: <HistoryOutlined />,
      label: 'Sessions',
    },
    {
      key: '/dashboard/audit',
      icon: <FileTextOutlined />,
      label: 'Audit Logs',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider
        theme="dark"
        width={250}
        className="fixed left-0 top-0 h-screen"
      >
        <div className="h-16 flex items-center justify-center text-white text-xl font-bold border-b border-gray-700">
          <DashboardOutlined className="mr-2" />
          Admin Dashboard
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="mt-4"
        />
      </Sider>
      <Layout className="ml-[250px]">
        <Header className="bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6">
          <div className="text-lg font-semibold">Dashboard</div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'logout') {
                    handleLogout();
                  } else if (key === 'profile') {
                    router.push('/profile');
                  }
                },
              }}
              placement="bottomRight"
            >
              <Button type="text" className="flex items-center gap-2">
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.name || user?.email}</span>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}


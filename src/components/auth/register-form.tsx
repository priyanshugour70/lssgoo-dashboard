'use client';

import { Form, Input, Button, Card, message } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth/use-auth';
import { registerSchema } from '@/types/auth';
import { useState } from 'react';

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      await register(registerSchema.parse(values));
      message.success('Registration successful!');
      router.push('/');
    } catch (error: any) {
      message.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Register" className="max-w-md mx-auto mt-8">
      <Form
        name="register"
        onFinish={onFinish}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: false }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Please enter a valid email!' },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: 'Please input your password!' },
            { min: 6, message: 'Password must be at least 6 characters!' },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Register
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}


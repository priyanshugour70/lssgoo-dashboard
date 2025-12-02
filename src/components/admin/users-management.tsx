'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Modal, Form, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { User } from '@/types/user';
import { successResponse, paginatedResponse, ErrorCodes } from '@/types/api';

export function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const fetchUsers = async (page = 1, pageSize = 20, searchTerm = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/v1/users?${params}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
        setPagination({
          page: data.pagination.page,
          pageSize: data.pagination.limit,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.page, pagination.pageSize, search);
  }, [pagination.page, pagination.pageSize, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        message.success('User deleted successfully');
        fetchUsers(pagination.page, pagination.pageSize, search);
      } else {
        message.error(data.error?.message || 'Failed to delete user');
      }
    } catch (error) {
      message.error('Failed to delete user');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingUser ? `/api/v1/users/${editingUser.id}` : '/api/v1/users';
      const method = editingUser ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(editingUser ? 'User updated successfully' : 'User created successfully');
        setModalVisible(false);
        fetchUsers(pagination.page, pagination.pageSize, search);
      } else {
        message.error(data.error?.message || 'Operation failed');
      }
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: User) => (
        <Space>
          {record.isActive ? (
            <Tag color="green">Active</Tag>
          ) : (
            <Tag color="red">Inactive</Tag>
          )}
          {record.isBlocked && <Tag color="red">Blocked</Tag>}
          {record.emailVerified ? (
            <Tag color="blue">Verified</Tag>
          ) : (
            <Tag color="orange">Unverified</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_: any, record: User) => (
        <Space>
          {record.roles?.map((role) => (
            <Tag key={role.id}>{role.role.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users Management</h1>
        <Space>
          <Input.Search
            placeholder="Search users..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create User
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, page, pageSize });
          },
        }}
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Create User'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
          >
            <Input />
          </Form.Item>
          {editingUser ? (
            <>
              <Form.Item
                name="isActive"
                label="Active"
                valuePropName="checked"
              >
                <input type="checkbox" />
              </Form.Item>
              <Form.Item
                name="isBlocked"
                label="Blocked"
                valuePropName="checked"
              >
                <input type="checkbox" />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input password!' }]}
            >
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}


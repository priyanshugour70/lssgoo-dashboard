'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Modal, Form, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import type { Role } from '@/types/rbac';

export function RolesManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();

  const fetchRoles = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(`/api/v1/roles?${params}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setRoles(data.data || []);
        setPagination({
          page: data.pagination.page,
          pageSize: data.pagination.limit,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      message.error('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(pagination.page, pagination.pageSize);
  }, [pagination.page, pagination.pageSize]);

  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      slug: role.slug,
      description: role.description,
      level: role.level,
      color: role.color,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingRole ? `/api/v1/roles/${editingRole.id}` : '/api/v1/roles';
      const method = editingRole ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(editingRole ? 'Role updated successfully' : 'Role created successfully');
        setModalVisible(false);
        fetchRoles(pagination.page, pagination.pageSize);
      } else {
        message.error(data.error?.message || 'Operation failed');
      }
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Role) => (
        <Space>
          {record.isActive ? (
            <Tag color="green">Active</Tag>
          ) : (
            <Tag color="red">Inactive</Tag>
          )}
          {record.isSystem && <Tag color="blue">System</Tag>}
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => count || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Role) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={record.isSystem}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Roles Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create Role
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={roles}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} roles`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, page, pageSize });
          },
        }}
      />

      <Modal
        title={editingRole ? 'Edit Role' : 'Create Role'}
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
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input role name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: 'Please input role slug!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: 'Please input level!' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="color"
            label="Color"
          >
            <Input type="color" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


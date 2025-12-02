'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Input, Modal, Form, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { Permission } from '@/types/rbac';

export function PermissionsManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [form] = Form.useForm();

  const fetchPermissions = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(`/api/v1/permissions?${params}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setPermissions(data.data || []);
        setPagination({
          page: data.pagination.page,
          pageSize: data.pagination.limit,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      message.error('Failed to fetch permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions(pagination.page, pagination.pageSize);
  }, [pagination.page, pagination.pageSize]);

  const handleCreate = () => {
    setEditingPermission(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    form.setFieldsValue({
      name: permission.name,
      slug: permission.slug,
      description: permission.description,
      category: permission.category,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingPermission ? `/api/v1/permissions/${editingPermission.id}` : '/api/v1/permissions';
      const method = editingPermission ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(editingPermission ? 'Permission updated successfully' : 'Permission created successfully');
        setModalVisible(false);
        fetchPermissions(pagination.page, pagination.pageSize);
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
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Permission) => (
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
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Permission) => (
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
        <h1 className="text-2xl font-bold">Permissions Management</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create Permission
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={permissions}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} permissions`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, page, pageSize });
          },
        }}
      />

      <Modal
        title={editingPermission ? 'Edit Permission' : 'Create Permission'}
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
            rules={[{ required: true, message: 'Please input permission name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            rules={[{ required: true, message: 'Please input permission slug!' }]}
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
            name="category"
            label="Category"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


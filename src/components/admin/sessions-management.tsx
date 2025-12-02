'use client';

import { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, message, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { Session } from '@/types/session';

export function SessionsManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });

  const fetchSessions = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      const response = await fetch(`/api/v1/sessions?${params}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setSessions(data.data || []);
        setPagination({
          page: data.pagination.page,
          pageSize: data.pagination.limit,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      message.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(pagination.page, pagination.pageSize);
  }, [pagination.page, pagination.pageSize]);

  const handleRevoke = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        message.success('Session revoked successfully');
        fetchSessions(pagination.page, pagination.pageSize);
      } else {
        message.error(data.error?.message || 'Failed to revoke session');
      }
    } catch (error) {
      message.error('Failed to revoke session');
    }
  };

  const columns = [
    {
      title: 'Device',
      key: 'device',
      render: (_: any, record: Session) => (
        <div>
          <div className="font-medium">{record.deviceName || 'Unknown Device'}</div>
          <div className="text-sm text-gray-500">{record.browser} on {record.os}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: any, record: Session) => (
        <div>
          <div>{record.location || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{record.ipAddress}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Session) => (
        <Space>
          {record.isActive ? (
            <Tag color="green">Active</Tag>
          ) : (
            <Tag color="red">Inactive</Tag>
          )}
          {record.isRevoked && <Tag color="red">Revoked</Tag>}
        </Space>
      ),
    },
    {
      title: 'Last Activity',
      dataIndex: 'lastActivityAt',
      key: 'lastActivityAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Expires At',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Session) => (
        <Popconfirm
          title="Are you sure you want to revoke this session?"
          onConfirm={() => handleRevoke(record.id)}
          disabled={!record.isActive || record.isRevoked}
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            disabled={!record.isActive || record.isRevoked}
          >
            Revoke
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sessions Management</h1>
      </div>

      <Table
        columns={columns}
        dataSource={sessions}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} sessions`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, page, pageSize });
          },
        }}
      />
    </div>
  );
}


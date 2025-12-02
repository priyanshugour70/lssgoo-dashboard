'use client';

import { useState, useEffect } from 'react';
import { Table, Tag, Input, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { AuditLog } from '@/types/audit';

export function AuditLogsManagement() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    userId: '',
  });

  const fetchLogs = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.entity && { entity: filters.entity }),
        ...(filters.userId && { userId: filters.userId }),
      });

      const response = await fetch(`/api/v1/audit?${params}`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setLogs(data.data || []);
        setPagination({
          page: data.pagination.page,
          pageSize: data.pagination.limit,
          total: data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(pagination.page, pagination.pageSize);
  }, [pagination.page, pagination.pageSize, filters]);

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color="blue">{action}</Tag>,
    },
    {
      title: 'Entity',
      dataIndex: 'entity',
      key: 'entity',
    },
    {
      title: 'User',
      key: 'user',
      render: (_: any, record: AuditLog) => (
        <div>
          <div>{record.userEmail || 'System'}</div>
          <div className="text-sm text-gray-500">{record.userId || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Changes',
      key: 'changes',
      render: (_: any, record: AuditLog) => (
        <div className="max-w-xs">
          {record.oldValues && (
            <div className="text-red-600 text-xs">
              Old: {JSON.stringify(record.oldValues).substring(0, 50)}...
            </div>
          )}
          {record.newValues && (
            <div className="text-green-600 text-xs">
              New: {JSON.stringify(record.newValues).substring(0, 50)}...
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
      </div>

      <div className="mb-4 space-x-2">
        <Input
          placeholder="Filter by action..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          style={{ width: 200 }}
          prefix={<SearchOutlined />}
        />
        <Input
          placeholder="Filter by entity..."
          value={filters.entity}
          onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
          style={{ width: 200 }}
        />
        <Input
          placeholder="Filter by user ID..."
          value={filters.userId}
          onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
          style={{ width: 200 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={logs}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} logs`,
          onChange: (page, pageSize) => {
            setPagination({ ...pagination, page, pageSize });
          },
        }}
      />
    </div>
  );
}


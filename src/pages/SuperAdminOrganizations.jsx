import { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { organizationAPI } from '../client/client';

export default function SuperAdminOrganizations() {
  const { isAdmin } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await organizationAPI.getAll();
      setOrgs(data.organizations || data?.data?.organizations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  if (!isAdmin) return <Navigate to="/votes" replace />;

  const onSave = async (id, value) => {
    try {
      setSavingId(id);
      setErrors({});
      await organizationAPI.updateAdmin(id, value);
      setOrgs((prev) => prev.map(o => o.id === id ? { ...o, admin_address: value } : o));
    } catch (e) {
      setErrors((prev) => ({ ...prev, [id]: e.message || '실패했습니다.' }));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">기관 관리자 설정</h1>
      {loading ? (
        <div className="text-gray-500">불러오는 중…</div>
      ) : (
        <div className="space-y-4">
          {orgs.map((o) => (
            <div key={o.id} className="border rounded p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="font-semibold">{o.name}</div>
                <div className="text-sm text-gray-500">ID: {o.id}</div>
              </div>
              <input
                defaultValue={o.admin_address || ''}
                onBlur={(e) => onSave(o.id, e.target.value.trim())}
                className="border rounded px-2 py-1 w-[420px]"
                placeholder="0x… 관리자 지갑 주소"
                disabled={savingId === o.id}
              />
              {savingId === o.id && <span className="text-sm text-gray-500">저장 중…</span>}
              {errors[o.id] && <span className="text-sm text-red-600">{errors[o.id]}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


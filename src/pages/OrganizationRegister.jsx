import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { organizationAPI } from '../client/client';

export default function OrganizationRegister() {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    businessNumber: '',
    adminAddress: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = useCallback(async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const data = await organizationAPI.getAll();
      setOrganizations(data.organizations || data?.data?.organizations || []);
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
      setError('기관 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
        <p className="text-gray-600">관리자만 이 페이지에 접근할 수 있습니다.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 유효성 검사
    if (!formData.name || !formData.businessNumber || !formData.adminAddress) {
      setError('모든 필수 항목을 입력해주세요.');
      return;
    }

    // 지갑 주소 검증
    if (!formData.adminAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('올바른 지갑 주소를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      await organizationAPI.register(formData.name, formData.businessNumber, formData.adminAddress);
      setSuccess('기관이 성공적으로 등록되었습니다!');

      // 폼 초기화
      setFormData({
        name: '',
        businessNumber: '',
        adminAddress: '',
        description: '',
      });

      // 목록 새로고침
      fetchOrganizations();
    } catch (err) {
      setError(err.message || '기관 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">기관 등록</h1>
        <p className="mt-2 text-gray-600">
          새로운 기관을 등록하고 투표를 생성할 수 있도록 설정합니다
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 등록 폼 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">새 기관 등록</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                기관명 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="예: ABC 주식회사"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="businessNumber" className="block text-sm font-medium text-gray-700 mb-1">
                사업자 등록번호 *
              </label>
              <input
                type="text"
                id="businessNumber"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleChange}
                placeholder="예: 123-45-67890"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="adminAddress" className="block text-sm font-medium text-gray-700 mb-1">
                관리자 지갑 주소 *
              </label>
              <input
                type="text"
                id="adminAddress"
                name="adminAddress"
                value={formData.adminAddress}
                onChange={handleChange}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                이 지갑 주소를 가진 사용자가 해당 기관의 관리자가 됩니다
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="기관에 대한 간단한 설명"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 rounded-md font-medium text-white ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isSubmitting ? '등록 중...' : '기관 등록하기'}
            </button>
          </form>
        </div>

        {/* 등록된 기관 목록 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">등록된 기관 목록</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              로딩 중...
            </div>
          ) : organizations.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        사업자번호: {org.business_number}
                      </p>
                    </div>
                    {org.token_id && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        Token #{org.token_id}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <p>관리자: {org.admin_address ? `${org.admin_address.slice(0, 10)}...${org.admin_address.slice(-8)}` : '미설정'}</p>
                    <p>등록일: {new Date(org.created_at).toLocaleDateString('ko-KR')}</p>
                    <p>크레딧: {org.credit_balance || 0} ETH</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="mt-2 text-sm text-gray-500">등록된 기관이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">기관 등록 안내</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p>1. 기관명과 사업자 등록번호를 입력하세요</p>
          <p>2. 해당 기관의 관리자가 될 지갑 주소를 입력하세요</p>
          <p>3. 등록이 완료되면 기관 관리자는 투표를 생성할 수 있습니다</p>
          <p>4. 등록된 기관은 '기관 관리자 설정' 페이지에서 관리자 주소를 변경할 수 있습니다</p>
        </div>
      </div>
    </div>
  );
}

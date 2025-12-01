import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { voteAPI, organizationAPI } from '../client/client';

export default function OrgAdminDashboard() {
  const { isOrgAdmin } = useAuth();
  const location = useLocation();
  const [votes, setVotes] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creditAmount, setCreditAmount] = useState('');
  const [showCreditModal, setShowCreditModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isOrgAdmin) return;

    try {
      setLoading(true);
      // 내 기관 정보 조회
      const response = await organizationAPI.getMine();

      const organizations = response?.organizations || response?.data?.organizations || [];

      if (organizations && organizations.length > 0) {
        const myOrg = organizations[0];
        setOrganization(myOrg);

        // 내 기관의 투표 목록 조회
        const votesResponse = await organizationAPI.getVotes(myOrg.id);

        const orgVotes = votesResponse?.votes || votesResponse?.data?.votes || [];
        setVotes(orgVotes);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [isOrgAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData, location.key]); // location.key가 변경되면 새로고침

  const handleCreditCharge = async () => {
    if (!organization || !creditAmount || parseFloat(creditAmount) <= 0) {
      alert('유효한 금액을 입력해주세요.');
      return;
    }

    try {
      await organizationAPI.addCredit(organization.id, parseFloat(creditAmount));
      alert(`${creditAmount} ETH가 충전되었습니다!`);
      setCreditAmount('');
      setShowCreditModal(false);
      fetchData(); // 잔액 새로고침
    } catch (error) {
      alert(error.message || '크레딧 충전에 실패했습니다.');
    }
  };

  if (!isOrgAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
        <p className="text-gray-600">기관 관리자만 이 페이지에 접근할 수 있습니다.</p>
      </div>
    );
  }

  // 통계 계산
  const activeVotes = votes.filter(v => v.status === 'active');
  const stats = {
    activeVotes: activeVotes.length,
    completedVotes: votes.filter(v => v.status === 'ended').length,
    totalParticipants: votes.reduce((sum, v) => sum + (v.participated || 0), 0),
    creditBalance: organization?.credit_balance || 0,
  };

  // 네트워크별 투표 분포
  const networkCounts = votes.reduce((acc, v) => {
    const network = v.network === 'ethereum' ? 'Ethereum' : 'Arbitrum';
    acc[network] = (acc[network] || 0) + 1;
    return acc;
  }, {});
  const networkData = Object.entries(networkCounts).map(([name, value]) => ({ name, value }));

  const COLORS = ['#4F46E5', '#F59E0B'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">기관 관리자 대시보드</h1>
          {organization && (
            <p className="mt-2 text-gray-600">{organization.name}</p>
          )}
        </div>
        <Link
          to="/admin/create-vote"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
        >
          + 새 투표 만들기
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          로딩 중...
        </div>
      ) : (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">진행중 투표</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeVotes}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">완료된 투표</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedVotes}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">총 참여자</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalParticipants.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-500">크레딧 잔액</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.creditBalance} ETH</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setShowCreditModal(true)}
                className="w-full mt-2 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
              >
                충전하기
              </button>
            </div>
          </div>

          {/* 차트 */}
          {networkData.length > 0 && (
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">네트워크별 투표 분포</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={networkData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {networkData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 진행중인 투표 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">진행중인 투표</h2>
            </div>
            <div className="p-6">
              {activeVotes.length > 0 ? (
                <div className="space-y-4">
                  {activeVotes.map((vote) => (
                    <div
                      key={vote.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{vote.title}</h3>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          진행중
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span>{vote.network === 'ethereum' ? '🔷 Ethereum' : '🔶 Arbitrum'}</span>
                        <span>•</span>
                        <span>
                          {vote.participated || 0} 참여
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-600">
                          종료일: {new Date(vote.end_time).toLocaleDateString('ko-KR')}
                        </span>
                        <div className="flex space-x-2">
                          <Link
                            to={`/admin/votes/${vote.id}`}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                          >
                            상세보기
                          </Link>
                          <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm">
                            중단하기
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  진행중인 투표가 없습니다
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 크레딧 충전 모달 */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">크레딧 충전</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                충전 금액 (ETH)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="예: 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreditCharge}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium"
              >
                충전하기
              </button>
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setCreditAmount('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

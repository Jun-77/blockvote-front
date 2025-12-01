import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import VoteCard from '../components/VoteCard';
import { voteAPI } from '../client/client';

export default function VoteList() {
  const { account } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    if (!account) return;

    try {
      setLoading(true);
      const data = await voteAPI.getAvailable(account);

      const votesArray = data?.votes || data?.data?.votes || [];

      const formattedVotes = votesArray.map((vote) => ({
        id: vote.id,
        title: vote.title,
        organization: vote.organization_name,
        description: vote.description,
        network: vote.network,
        status: vote.status,
        imageUrl: vote.image_url || 'https://via.placeholder.com/400x200',
        participated: vote.participated || 0,
        totalVoters: 50,
        endDate: new Date(vote.end_time).toISOString().split('T')[0],
        hasVoted: !!vote.hasVoted,
        hasAccess: vote.hasAccess !== undefined ? vote.hasAccess : true,
      }));
      setVotes(formattedVotes);
    } catch (error) {
      console.error('Failed to fetch votes:', error);
      setVotes([]);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const filteredVotes = votes.filter((vote) => {
    // 탭 필터
    if (activeTab === 'available' && (vote.hasVoted || !vote.hasAccess || vote.status !== 'active')) {
      return false;
    }
    if (activeTab === 'participated' && !vote.hasVoted) {
      return false;
    }
    if (activeTab === 'ended' && vote.status !== 'ended') {
      return false;
    }

    // 검색 필터
    if (
      searchTerm &&
      !vote.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !vote.organization.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">투표</h1>
        <div className="text-sm text-gray-600">지갑 {account?.slice(0, 6)}...{account?.slice(-4)}</div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`${
              activeTab === 'all'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`${
              activeTab === 'available'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            참여 가능
          </button>
          <button
            onClick={() => setActiveTab('participated')}
            className={`${
              activeTab === 'participated'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            참여 완료
          </button>
          <button
            onClick={() => setActiveTab('ended')}
            className={`${
              activeTab === 'ended'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            종료됨
          </button>
        </nav>
      </div>

      {/* 검색 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="투표 제목 또는 기관명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 투표 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : filteredVotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVotes.map((vote) => (
            <VoteCard key={vote.id} vote={vote} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">투표가 없습니다</p>
        </div>
      )}
    </div>
  );
}


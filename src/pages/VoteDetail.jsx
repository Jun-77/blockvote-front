import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { voteAPI } from '../api/client';

export default function VoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, signer } = useAuth();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [vote, setVote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (account) {
      fetchVoteDetail();
    }
  }, [id, account]);

  const fetchVoteDetail = async () => {
    try {
      setLoading(true);
      const data = await voteAPI.getById(id, account);

      // API 응답 구조 확인 (client.js의 request 함수가 data를 추출함)
      const voteData = data.vote || data;

      if (!voteData) {
        setVote(null);
        return;
      }

      // 데이터 포맷 변환
      const formattedVote = {
        id: voteData.id,
        title: voteData.title,
        organization: voteData.organization_name,
        description: voteData.description || '',
        network: voteData.network,
        status: voteData.status,
        imageUrl: voteData.image_url || 'https://via.placeholder.com/800x400',
        participated: voteData.participated || 0,
        totalVoters: 50, // 실제로는 기관 멤버 수를 조회해야 함
        startDate: voteData.start_time,
        endDate: voteData.end_time,
        hasVoted: voteData.hasVoted || false,
        hasAccess: voteData.hasAccess !== undefined ? voteData.hasAccess : true,
        contractAddress: voteData.contract_address,
        options: (voteData.options || []).map(opt => ({
          id: opt.id,
          index: opt.option_index, // 백엔드로 보낼 실제 인덱스
          name: opt.option_name,
          votes: opt.votes_count || 0,
          percentage: voteData.participated > 0
            ? Math.round((opt.votes_count / voteData.participated) * 100)
            : 0
        })),
      };

      setVote(formattedVote);
    } catch (error) {
      console.error('Failed to fetch vote detail:', error);
      setVote(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!selectedOption) {
      alert('투표할 옵션을 선택해주세요.');
      return;
    }

    if (!signer) {
      alert('지갑을 먼저 연결해주세요.');
      return;
    }

    setIsVoting(true);

    try {
      // EIP-712 서명 생성 (실제로는 백엔드 API 호출)
      const domain = {
        name: 'BlockchainVoting',
        version: '1',
        chainId: 1, // 실제 체인 ID로 변경
        verifyingContract: vote.contractAddress,
      };

      const types = {
        Vote: [
          { name: 'voter', type: 'address' },
          { name: 'voteId', type: 'uint256' },
          { name: 'optionIndex', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
        ],
      };

      const value = {
        voter: account,
        voteId: vote.id,
        optionIndex: selectedOption,
        nonce: Date.now(), // 실제로는 백엔드에서 관리
      };

      // 서명 요청
      const signature = await signer.signTypedData(domain, types, value);

      // 백엔드에 서명 전송 (selectedOption은 option.index 값)
      const selectedOptionData = vote.options.find(opt => opt.id === selectedOption);
      if (!selectedOptionData) {
        throw new Error('선택한 옵션을 찾을 수 없습니다.');
      }
      await voteAPI.submit(vote.id, account, selectedOptionData.index, signature);

      setShowSuccess(true);

      // 3초 후 투표 목록으로 이동
      setTimeout(() => {
        navigate('/votes');
      }, 3000);
    } catch (error) {
      console.error('투표 실패:', error);
      alert('투표에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsVoting(false);
    }
  };

  const getDaysRemaining = () => {
    if (!vote || !vote.endDate) return 0;
    const now = new Date();
    const end = new Date(vote.endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!vote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">투표를 찾을 수 없습니다</p>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">투표 완료!</h3>
          <p className="text-gray-600 mb-4">
            투표가 성공적으로 제출되었습니다
          </p>
          <p className="text-sm text-gray-500 mb-4">
            선택: {vote.options?.find(opt => opt.id === selectedOption)?.name || ''}
          </p>
          <p className="text-xs text-gray-400">
            잠시 후 투표 목록으로 이동합니다...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 헤더 */}
      <div>
        <button
          onClick={() => navigate('/votes')}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          돌아가기
        </button>

        {vote.imageUrl && (
          <img
            src={vote.imageUrl}
            alt={vote.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{vote.title}</h1>
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            진행중
          </span>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{vote.organization}</span>
          <span>•</span>
          <span>{vote.network === 'ethereum' ? '🔷 Ethereum' : '🔶 Arbitrum'}</span>
        </div>
      </div>

      {/* 투표 정보 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">투표 설명</h2>
          <p className="text-gray-700">{vote.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-500">투표 기간</p>
            <p className="font-medium">
              {new Date(vote.startDate).toLocaleDateString('ko-KR')} ~{' '}
              {new Date(vote.endDate).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">남은 시간</p>
            <p className="font-medium text-red-600">D-{getDaysRemaining()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">참여율</p>
            <p className="font-medium">
              {vote.participated}/{vote.totalVoters} ({Math.round((vote.participated / vote.totalVoters) * 100)}%)
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">컨트랙트 주소</p>
            <p className="font-mono text-xs">
              {vote.contractAddress ? `${vote.contractAddress.slice(0, 10)}...${vote.contractAddress.slice(-8)}` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 투표 옵션 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">
          {vote.hasVoted ? '투표 결과' : '투표 선택'}
        </h2>

        <div className="space-y-3">
          {(vote.options || []).map((option) => (
            <div
              key={option.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                selectedOption === option.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${vote.hasVoted ? 'cursor-default' : ''}`}
              onClick={() => !vote.hasVoted && setSelectedOption(option.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {!vote.hasVoted && (
                    <input
                      type="radio"
                      checked={selectedOption === option.id}
                      onChange={() => setSelectedOption(option.id)}
                      className="mr-3 h-4 w-4 text-indigo-600"
                    />
                  )}
                  <span className="font-medium">{option.name}</span>
                </div>
                <span className="text-sm font-semibold">
                  {option.votes}표 ({option.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${option.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {!vote.hasVoted && vote.hasAccess && vote.status === 'active' && (
          <div className="mt-6 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">주의사항</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 투표는 한 번만 가능하며 수정할 수 없습니다</li>
                <li>• 투표 결과는 블록체인에 영구 기록됩니다</li>
                <li>• 가스비는 기관이 부담하므로 무료입니다</li>
              </ul>
            </div>

            <button
              onClick={handleVote}
              disabled={!selectedOption || isVoting}
              className={`w-full py-3 px-4 rounded-md font-medium text-white ${
                !selectedOption || isVoting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isVoting ? '투표 처리 중...' : '투표하기'}
            </button>
          </div>
        )}

        {vote.hasVoted && (
          <div className="mt-6 bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-gray-700 font-medium">이미 투표에 참여하셨습니다</p>
          </div>
        )}

        {!vote.hasAccess && (
          <div className="mt-6 bg-yellow-50 rounded-lg p-4 text-center">
            <p className="text-yellow-800 font-medium mb-2">
              이 투표에 참여하려면 기관 인증이 필요합니다
            </p>
            <p className="text-sm text-yellow-700">
              기관 관리자에게 문의하여 인증 토큰을 발급받으세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

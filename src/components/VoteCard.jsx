import { Link } from 'react-router-dom';

export default function VoteCard({ vote }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return '진행중';
      case 'ended':
        return '종료됨';
      case 'upcoming':
        return '예정';
      default:
        return '알수없음';
    }
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
      {vote.imageUrl && (
        <img src={vote.imageUrl} alt={vote.title} className="w-full h-48 object-cover rounded-md mb-4" />
      )}

      <div className="flex items-center justify-between mb-2">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(vote.status)}`}>
          {getStatusText(vote.status)}
        </span>
        <span className="text-xs text-gray-500">
          {vote.network === 'ethereum' ? '이더리움 Ethereum' : '아비트럼 Arbitrum'}
        </span>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{vote.title}</h3>
      <p className="text-sm text-gray-600 mb-3">{vote.organization}</p>

      {vote.description && <p className="text-sm text-gray-700 mb-4 line-clamp-2">{vote.description}</p>}

      <div className="space-y-2 mb-4">
        {vote.status === 'active' && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">참여</span>
              <span className="font-semibold">
                {vote.participated}/{vote.totalVoters} ({Math.round((vote.participated / vote.totalVoters) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${(vote.participated / vote.totalVoters) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">마감까지</span>
              <span className="font-semibold text-red-600">D-{getDaysRemaining(vote.endDate)}</span>
            </div>
          </>
        )}

        {vote.status === 'ended' && (
          <div className="text-sm text-gray-600">종료일 {new Date(vote.endDate).toLocaleDateString('ko-KR')}</div>
        )}
      </div>

      <div className="flex gap-2">
        {vote.status === 'active' && !vote.hasVoted && vote.hasAccess && (
          <Link
            to={`/votes/${vote.id}`}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-center text-sm font-medium"
          >
            투표하기
          </Link>
        )}

        {vote.status === 'active' && vote.hasVoted && (
          <Link
            to={`/votes/${vote.id}`}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-center text-sm font-medium cursor-default"
          >
            이미 참가함
          </Link>
        )}

        {!vote.hasAccess && (
          <span className="flex-1 bg-yellow-100 text-yellow-800 py-2 px-4 rounded-md text-center text-sm font-medium">
            접근 권한 필요
          </span>
        )}

        <Link
          to={`/votes/${vote.id}`}
          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 text-center text-sm font-medium"
        >
          상세 보기
        </Link>
      </div>
    </div>
  );
}


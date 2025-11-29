import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { voteAPI } from '../api/client';

export default function CreateVote() {
  const { isOrgAdmin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    network: 'ethereum',
    startTime: '',
    endTime: '',
    imageUrl: '',
  });

  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOrgAdmin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">접근 권한이 없습니다</h2>
        <p className="text-gray-600">기관 관리자만 투표를 생성할 수 있습니다.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!formData.title || !formData.startTime || !formData.endTime) {
      setError('제목, 시작 시간, 종료 시간은 필수입니다.');
      return;
    }

    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      setError('최소 2개의 투표 옵션이 필요합니다.');
      return;
    }

    // 시간 검증
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    if (end <= start) {
      setError('종료 시간은 시작 시간보다 늦어야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await voteAPI.create({
        title: formData.title,
        description: formData.description,
        network: formData.network,
        startTime: formData.startTime,
        endTime: formData.endTime,
        options: validOptions,
        imageUrl: formData.imageUrl,
      });

      alert('투표가 성공적으로 생성되었습니다!');
      navigate('/org-admin/dashboard');
    } catch (err) {
      setError(err.message || '투표 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">새 투표 만들기</h1>
        <p className="mt-2 text-gray-600">투표 정보를 입력하여 새로운 투표를 생성하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 제목 */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            투표 제목 *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="예: 2025년 이사회 의장 선출"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {/* 설명 */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            투표 설명
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="투표에 대한 설명을 입력하세요"
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 네트워크 선택 */}
        <div>
          <label htmlFor="network" className="block text-sm font-medium text-gray-700 mb-1">
            블록체인 네트워크 *
          </label>
          <select
            id="network"
            name="network"
            value={formData.network}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          >
            <option value="ethereum">Ethereum (높은 신뢰도, 높은 비용)</option>
            <option value="arbitrum">Arbitrum (빠른 속도, 낮은 비용)</option>
          </select>
        </div>

        {/* 투표 기간 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              시작 시간 *
            </label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              종료 시간 *
            </label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {/* 이미지 URL */}
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
            이미지 URL (선택)
          </label>
          <input
            type="url"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 투표 옵션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            투표 옵션 * (최소 2개, 최대 10개)
          </label>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`옵션 ${index + 1}`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <button
              type="button"
              onClick={addOption}
              className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              + 옵션 추가
            </button>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/org-admin/dashboard')}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 px-4 py-2 rounded-md font-medium text-white ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting ? '생성 중...' : '투표 생성하기'}
          </button>
        </div>
      </form>

      {/* 안내 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">투표 생성 안내</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 투표는 생성 즉시 활성화되며, 시작 시간부터 참여 가능합니다.</li>
          <li>• 종료 시간 이후 자동으로 투표가 종료됩니다.</li>
          <li>• Ethereum은 높은 신뢰도가 필요한 중요 투표에 적합합니다.</li>
          <li>• Arbitrum은 빠른 처리와 저렴한 비용이 필요한 일반 투표에 적합합니다.</li>
        </ul>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import Swal from 'sweetalert2';
import { AxiosError } from 'axios';

interface ReviewDto {
    reviewId: number;
    productId: number;
    memberId: number;
    nickname: string;
    orderDetailId: number;
    rating: number;
    title: string;
    content: string;
    reviewImageUrl: string;
    createdAt: string;
    updatedAt: string;
    status: string;
};

interface ReviewModalProps {
    show: boolean;
    onClose: () => void;
    productId: number;
    memberId: number;
    initialData: ReviewDto | null; // 수정 모드일 때 전달될 리뷰 데이터
    onSubmitSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ show, onClose, productId, memberId, initialData, onSubmitSuccess }) => {
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [title, setTitle] = useState(initialData?.title || '');
    const [content, setContent] = useState(initialData?.content || '');
    const [error, setError] = useState('');

    // initialData가 변경될 때마다 폼 필드를 업데이트 (수정 모드 진입 시)
    useEffect(() => {
        if (initialData) {
            setRating(initialData.rating);
            setTitle(initialData.title);
            setContent(initialData.content);
        } else {
            // 새 리뷰 작성 모드일 때 필드 초기화
            setRating(2.5);
            setTitle('');
            setContent('');
        }
        setError(''); // 모달 열릴 때 에러 메시지 초기화
    }, [initialData, show]); // show prop이 변경될 때도 초기화

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !content) {
            setError('별점과 내용은 필수 항목입니다.');
            return;
        }
        
        const reviewData = {
            productId,
            memberId,
            orderDetailId: initialData?.orderDetailId || 0, // 수정 시 기존 orderDetailId 사용, 아니면 임시 0
            rating,
            title,
            content,
            status: 'APPROVED', // TODO: 필요에 따라 상태 선택 기능 추가
            ...(initialData && { reviewId: initialData.reviewId }) // 수정 시 reviewId 포함
        };

        try {
                if (initialData) {
                // 리뷰 수정
                await api.post('/api/reviews/update', reviewData);
                await Swal.fire({ icon: 'success', title: '완료', text: '리뷰가 성공적으로 수정되었습니다.' });
            } else {
                // 새 리뷰 작성
                await api.post('/api/reviews', reviewData);
                await Swal.fire({ icon: 'success', title: '완료', text: '리뷰가 성공적으로 등록되었습니다.' });
            }
            onSubmitSuccess(); // 부모 컴포넌트에 성공 알림
            onClose(); // 모달 닫기
        } catch (err) {
            console.error('리뷰 제출/수정 실패:', err);
            const axiosError = err as AxiosError<{ message?: string }>;
            if (axiosError.response && axiosError.response.data && axiosError.response.data.message && axiosError.response.data.message.includes('이미 해당 상품에 대한 리뷰를 작성하셨습니다.')) {
                setError('이미 해당 상품에 대한 리뷰를 작성하셨습니다.');
            } else {
                setError('리뷰 등록/수정에 실패했습니다. 다시 시도해주세요.');
            }
        }
    };

    if (!show) {
        return null;
    }

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{initialData ? '리뷰 수정' : '리뷰 작성'}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            <div className="mb-3">
                                <div className="d-flex align-items-center justify-content-between">
                                    <label htmlFor="ratingSlider" className="form-label mb-0">별점</label>
                                    <div style={{ fontSize: '1.5rem', minWidth: '100px', textAlign: 'right', letterSpacing: '4px' }}>
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const starValue = i + 1;
                                            if (starValue <= Math.floor(rating)) {
                                                return <span key={i} style={{ color: 'var(--primary-color)' }}>★</span>;
                                            } else if (starValue - 0.5 === rating) {
                                                return <span key={i} style={{ color: 'var(--primary-color)' }}>☆</span>;
                                            } else {
                                                return <span key={i} style={{ color: '#ddd' }}>☆</span>;
                                            }
                                        })}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '8px' }}>
                                    <input
                                        id="ratingSlider"
                                        type="range"
                                        min="0"
                                        max="10"
                                        step="1"
                                        value={rating * 2}
                                        onChange={(e) => setRating(parseInt(e.target.value) / 2)}
                                        style={{
                                            flex: 1,
                                            height: '8px',
                                            borderRadius: '5px',
                                            background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${(rating / 5) * 100}%, #ddd ${(rating / 5) * 100}%, #ddd 100%)`,
                                            outline: 'none',
                                            WebkitAppearance: 'none',
                                            appearance: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="reviewTitle" className="form-label">제목</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="reviewTitle"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="reviewContent" className="form-label">내용</label>
                                <textarea
                                    className="form-control"
                                    id="reviewContent"
                                    rows={5}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>닫기</button>
                            <button type="submit" className="btn btn-primary">{initialData ? '수정 완료' : '제출'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReviewModal;

import React from 'react';
import ChatRoom from './ChatRoom';

interface ProductInquiryModalProps {
    show: boolean;
    onClose: () => void;
    productId: number;
    currentUserId: number | null;
    currentUserNickname: string | null;
    currentProductTitle: string;
    navigate: (path: string) => void; // navigate 함수를 prop으로 받음
}

const ProductInquiryModal: React.FC<ProductInquiryModalProps> = ({ 
    show, 
    onClose, 
    productId, 
    currentUserId, 
    currentUserNickname, 
    currentProductTitle,
    navigate
}) => {
    if (!show) {
        return null;
    }

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg" style={{ maxWidth: '600px' }}>
                <div className="modal-content" style={{ borderRadius: '0.75rem', border: 'none' }}>
                    <div className="modal-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
                        <h5 className="modal-title" style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                            상품 문의: {currentProductTitle}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-0" style={{ height: '550px', display: 'flex', flexDirection: 'column' }}>
                        {currentUserId && currentUserNickname ? (
                            <ChatRoom
                                productId={productId}
                                currentUserId={currentUserId}
                                currentUserNickname={currentUserNickname}
                                currentProductTitle={currentProductTitle}
                            />
                        ) : (
                            <div className="chat-login-prompt">
                                <h4>🔒 채팅에 참여하려면 로그인이 필요합니다.</h4>
                                <button 
                                    onClick={() => {
                                        onClose();
                                        navigate('/login');
                                    }} 
                                    className="btn chat-login-prompt .btn"
                                    style={{ 
                                        background: 'var(--primary-color)', 
                                        border: 'none',
                                        color: 'white',
                                        padding: '0.75rem 2rem',
                                        fontWeight: '600'
                                    }}
                                >
                                    로그인 페이지로
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductInquiryModal;

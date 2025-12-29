import {useEffect, useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import api from "../../api/axiosInstance";
import Swal from "sweetalert2";
import ReviewModal from "./ReviewModal";
import ProductInquiryModal from "./ProductInquiryModal"; // 상품 문의 모달 컴포넌트 임포트

type Product = {
    id: number;
    title: string;
    status: string;
    marketName: string;
    marketLink: string;
    category: string;
    sellPrice: number;
    viewCount: number;
    wishCount: number;
    productDesc: string;
    image: string;
    createDate: string;
};

type ReviewDto = {
    reviewId: number;
    productId: number;
    memberId: number;
    nickname: string; // 닉네임 필드 추가
    orderDetailId: number;
    rating: number;
    title: string;
    content: string;
    reviewImageUrl: string;
    createdAt: string;
    updatedAt: string;
    status: string;
};


const ShowOneProductPage = () => {
    const {id} = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const [userInfo, setUserInfo] = useState<{ userId: number; nickname: string } | null>(null);
    const navigate = useNavigate();

    // 리뷰 상태 추가
    const [allReviews, setAllReviews] = useState<ReviewDto[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 10;

    // 구매 여부, 모달 상태 및 리뷰 수정 상태 추가
    const [hasPurchased, setHasPurchased] = useState(false);
    const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false); // 리뷰 중복 작성 방지
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewToEdit, setReviewToEdit] = useState<ReviewDto | null>(null); // 수정할 리뷰 데이터
    const [isProductInquiryModalOpen, setIsProductInquiryModalOpen] = useState(false); // 상품 문의 모달 상태

    const DEFAULT_IMAGE = "http://localhost:8080/images/animated-icon-loading-19021458.gif";


    const fetchReviews = async () => {
        try {
            const reviewRes = await api.get(`/api/reviews/product/${id}`);
            setAllReviews(reviewRes.data);
            
            // 리뷰 새로고침 시 중복 작성 여부도 다시 확인
            if (userInfo && id) { // userInfo와 id가 null이 아닌 경우에만 실행
                const userReview = reviewRes.data.find((review: ReviewDto) => review.memberId === userInfo.userId && review.productId === parseInt(id, 10));
                setHasAlreadyReviewed(!!userReview);
            }

        } catch (reviewErr) {
            console.error("Error fetching reviews:", reviewErr);
        }
    };


    useEffect(() => {
        const fetchMyInfoAndProduct = async () => {
            setLoading(true);
            const token = localStorage.getItem('logIn');
            let currentMemberId: number | null = null;

            if (token) {
                try {
                    const response = await api.get('/api/member/me');
                    const data = response.data;
                    setUserInfo({userId: data.id, nickname: data.nickname || ""});
                    currentMemberId = data.id;
                } catch (e) {
                    console.error(e);
                }
            }

            try {
                await api.post(`/api/product/view/${id}`);
                const res = await api.get(`/api/product/showOne/${id}`);
                setProduct(res.data);

                // 최근 본 상품 목록을 localStorage에 저장
                let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewedProducts') || '[]');
                // 중복 제거 및 최대 4개 항목 유지
                recentlyViewed = [res.data.id, ...recentlyViewed.filter((item: number) => item !== res.data.id)].slice(0, 4);
                localStorage.setItem('recentlyViewedProducts', JSON.stringify(recentlyViewed));

                const reviewRes = await api.get(`/api/reviews/product/${id}`);
                setAllReviews(reviewRes.data);

                if (currentMemberId && id) {
                    const userReview = reviewRes.data.find((review: ReviewDto) => review.memberId === currentMemberId && review.productId === parseInt(id, 10));
                    setHasAlreadyReviewed(!!userReview);

                    try {
                        const validateRes = await api.get('/api/order/validate', {
                            params: {
                                productId: parseInt(id, 10),
                                memberId: currentMemberId
                            }
                        });
                        setHasPurchased(validateRes.data > 0);
                    } catch (validateErr) {
                        console.error("Error validating purchase:", validateErr);
                        setHasPurchased(false);
                    }
                }

            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyInfoAndProduct();
    }, [id]);

    const addToCart = () => {
        // 품절 상품 확인
        if (product?.status === "SOLD_OUT") {
            Swal.fire({ icon: "error", title: "품절", text: "품절된 상품입니다." });
            return;
        }

        const token = localStorage.getItem("logIn");
        if (!token) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." });
            return;
        }

        api.get("/api/member/me").then((res) => {
            const memberId = res.data.id;

            const cart = {
                memberId: memberId,
                productId: product!.id,
                quantity: 1
            }
            api.post("/api/cart/insertCart", cart).then(() => {
                Swal.fire({ icon: "success", title: "완료", text: "장바구니에 담았습니다." });
            });
        });
    };

    const toggleWish = () => {
        const token = localStorage.getItem('logIn');

        if (!token) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." });
            return;
        }
        api.get(`/api/product/wish/${product!.id}`)
            .then(res => {
                setProduct(prevProduct => ({
                    ...prevProduct!,
                    wishCount: res.data.wishCount
                }));
            });
    };

    const getStatusBadge = (status: string) => {
        if (status === "ON_SALE") {
            return (
                <span className="badge rounded-pill bg-success-subtle text-success">
          판매중
        </span>
            )
        } else if (status === "SOLD_OUT") {
            return (
                <span className="badge rounded-pill bg-secondary">
        품절
      </span>
            )
        }
    }

    const handleWriteReview = () => {
        if (!userInfo) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "리뷰를 작성하려면 로그인이 필요합니다." }).then(() => navigate('/login'));
            return;
        }
        setReviewToEdit(null); // 새 리뷰 작성 모드
        setIsReviewModalOpen(true);
    }

    const handleEditReview = (review: ReviewDto) => {
        if (!userInfo || review.memberId !== userInfo.userId) {
            Swal.fire({ icon: "warning", title: "권한 없음", text: "본인이 작성한 리뷰만 수정할 수 있습니다." });
            return;
        }
        setReviewToEdit(review); // 수정할 리뷰 데이터 설정
        setIsReviewModalOpen(true);
    };

    const handleDeleteReview = async (reviewIdToDelete: number) => {
        if (!userInfo) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." }).then(() => navigate('/login'));
            return;
        }
        const conf = await Swal.fire({ title: "정말 이 리뷰를 삭제하시겠습니까?", icon: "warning", showCancelButton: true, confirmButtonText: '삭제', cancelButtonText: '취소' });
        if (!conf.isConfirmed) return;

        try {
            await api.post('/api/reviews/delete', { reviewId: reviewIdToDelete });
            Swal.fire({ icon: "success", title: "삭제", text: "리뷰가 삭제되었습니다." });
            await fetchReviews(); // 리뷰 목록 새로고침
        } catch (error) {
            console.error("리뷰 삭제 실패:", error);
            Swal.fire({ icon: "error", title: "실패", text: "리뷰 삭제에 실패했습니다." });
        }
    };

    if (loading) return <div>불러오는 중...</div>;
    if (!product || !id) return <div>상품을 찾을 수 없습니다.</div>;


    // --- 리뷰 페이지네이션 로직 ---
    const totalPages = Math.ceil(allReviews.length / reviewsPerPage);
    const indexOfLastReview = currentPage * reviewsPerPage;
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
    const currentReviews = allReviews.slice(indexOfFirstReview, indexOfLastReview);

    const paginate = (pageNumber: number) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };
    // --- 리뷰 페이지네이션 로직 끝 ---


    return (
        <>
            <div className="container mt-4">
                <div className="row">
                    <div className="col-md-6">
                        <img
                            src={product.image
                                ? `http://localhost:8080/images/${product.image.replace('=', '')}`
                                : DEFAULT_IMAGE}
                            alt={product.title}
                            className="img-fluid rounded"
                            style={{maxWidth: '100%', height: '500px', objectFit: 'cover'}}
                        />
                    </div>
                    <div className="col-md-6">
                        <h2>{product.title} {getStatusBadge(product.status)}</h2>
                        <p className="text-muted">카테고리: {product.category}</p>
                        <p className="lead" style={{fontSize: '2rem', fontWeight: 'bold'}}>{product.sellPrice.toLocaleString()}원</p>
                        <hr/>
                        <p>{product.productDesc}</p>
                        <div className="d-flex justify-content-between text-muted">
                            <span>조회수: {product.viewCount}</span>
                            <span onClick={toggleWish} style={{cursor: 'pointer'}}>{userInfo ? '❤️' : '🤍'} {product.wishCount}</span>
                        </div>
                        <p>
                            판매처:{" "}
                            <a href={product.marketLink} target="_blank" rel="noreferrer">
                                {product.marketName}
                            </a>
                        </p>
                        <p>등록일: {new Date(product.createDate).toLocaleDateString()}</p>
                        <div className="d-grid gap-2">
                             <button 
                                className="btn btn-primary" 
                                onClick={addToCart}
                                disabled={product?.status === "SOLD_OUT"}
                             >
                                {product?.status === "SOLD_OUT" ? "품절됨" : "장바구니에 담기"}
                             </button>
                             <button
                                onClick={() => setIsProductInquiryModalOpen(true)} // 상품 문의 모달 열기
                                className="btn btn-info"
                            >
                                상품 문의
                            </button>
                            {hasPurchased && !hasAlreadyReviewed && (
                                <button className="btn btn-success" onClick={handleWriteReview}>
                                    리뷰 작성하기
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="row mt-5">
                    {/* ChatRoom 컴포넌트 인라인 렌더링 대신 모달로 분리 */}
                </div>

                {/* 리뷰 섹션 */}
                <div className="row mt-5">
                    <div className="col-12">
                        <h3>상품 리뷰 ({allReviews.length})</h3>
                        <hr/>
                        {currentReviews.length > 0 ? (
                            currentReviews.map(review => (
                                <div key={review.reviewId} className="card mb-3">
                                    <div className="card-body">
                                        <h5 className="card-title">{"⭐".repeat(review.rating)} {review.title}</h5>
                                        <p className="card-text">{review.content}</p>
                                        <p className="card-text">
                                            <small className="text-muted">
                                                작성자: {review.nickname} | 작성일: {new Date(review.createdAt).toLocaleDateString()}
                                            </small>
                                            {userInfo && review.memberId === userInfo.userId && (
                                                <span className="float-end">
                                                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => handleEditReview(review)}>수정</button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteReview(review.reviewId)}>삭제</button>
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>작성된 리뷰가 없습니다.</p>
                        )}

                        {/* 페이지네이션 UI */}
                        {totalPages > 1 && (
                            <nav>
                                <ul className="pagination justify-content-center">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                                            이전
                                        </button>
                                    </li>
                                    {Array.from({length: totalPages}, (_, i) => i + 1).map(number => (
                                        <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                            <button onClick={() => paginate(number)} className="page-link">
                                                {number}
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                                            다음
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </div>
                </div>
            </div>
            {userInfo && (
                 <ReviewModal
                    show={isReviewModalOpen}
                    onClose={() => {
                        setIsReviewModalOpen(false);
                        setReviewToEdit(null); // 모달 닫을 때 수정 데이터 초기화
                    }}
                    productId={parseInt(id, 10)}
                    memberId={userInfo.userId}
                    initialData={reviewToEdit} // 수정 모드일 때 데이터 전달
                    onSubmitSuccess={fetchReviews}
                />
            )}
            {/* 상품 문의 모달 렌더링 */}
            {userInfo && product && (
                <ProductInquiryModal
                    show={isProductInquiryModalOpen}
                    onClose={() => setIsProductInquiryModalOpen(false)}
                    productId={parseInt(id, 10)}
                    currentUserId={userInfo.userId}
                    currentUserNickname={userInfo.nickname}
                    currentProductTitle={product.title}
                    navigate={navigate}
                />
            )}
        </>
    );
}
export default ShowOneProductPage;
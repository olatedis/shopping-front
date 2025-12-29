// src/pages/admin/ManageOrderPage.tsx

import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../api/axiosInstance";
import Swal from "sweetalert2";

// DB status 문자열
type OrderStatus =
    | "ORDER_CHECKING"
    | "PREPARING"
    | "SHIPPING"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELLED"
    | "RETURNED"
    | "EXCHANGED"
    | string; // 혹시 모르는 값 대비

interface OrderSummary {
    id: number;
    memberId: number;
    userId: string;
    nickname: string;
    receiverName: string;
    phone: string;
    address: string;
    status: OrderStatus;
    orderDate: string;
    totalPrice: number;
    itemCount: number;
    paymentMethod: string | null;
    productIds: string | null;     // "1,5,7"
    productTitles: string | null;
}

const STATUS_LABELS: Record<string, string> = {
    ORDER_CHECKING: "주문확인중",
    PREPARING: "상품준비중",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    COMPLETED: "구매확정",
    CANCELLED: "취소",
    RETURNED: "반품",
    EXCHANGED: "교환",
};

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    {value: "PREPARING", label: "상품준비중"},
    {value: "SHIPPING", label: "배송중"},
    {value: "DELIVERED", label: "배송완료"},
    {value: "COMPLETED", label: "구매확정"},
    {value: "CANCELLED", label: "취소"},
    {value: "RETURNED", label: "반품"},
    {value: "EXCHANGED", label: "교환"},
];

const PAGE_SIZE = 10;


const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("ko-KR");
};

const formatMoney = (value: number | null | undefined) => {
    if (value == null) return "-";
    return value.toLocaleString("ko-KR") + "원";
};

const getStatusBadgeClass = (status: string): string => {
    switch (status) {
        case "PREPARING":
            return "badge bg-warning text-dark";
        case "SHIPPING":
            return "badge bg-info text-dark";
        case "DELIVERED":
        case "COMPLETED":
            return "badge bg-success";
        case "CANCELLED":
        case "RETURNED":
        case "EXCHANGED":
            return "badge bg-danger";
        case "ORDER_CHECKING":
        default:
            return "badge bg-secondary";
    }
};

const ManageOrderPage = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState<OrderSummary[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

    // 검색 상태
    const [buyerKeyword, setBuyerKeyword] = useState("");
    const [productKeyword, setProductKeyword] = useState("");
    const [orderIdInput, setOrderIdInput] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [itemCountMin, setItemCountMin] = useState("");
    const [itemCountMax, setItemCountMax] = useState("");

    // 페이지네이션
    const [currentPage, setCurrentPage] = useState(1);

    const getPageNumbers = () => {
        // currentPage 기준으로 가운데 오도록 시도 (1,2,3,4,5 / 2,3,4,5,6 이런 식)
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4); // 최대 5개

        // totalPages 가 5보다 작을 때 양쪽 정리
        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }

        const pages: number[] = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };


    // 우측 상세 영역 상태 변경용
    const selectedOrder = useMemo(
        () => orders.find((o) => o.id === selectedOrderId) || null,
        [orders, selectedOrderId]
    );
    const [editStatus, setEditStatus] = useState<OrderStatus | "">("");

    useEffect(() => {
        // 로그인 & 관리자 체크 패턴 (ManageMemberPage와 동일 느낌으로)
        const token = localStorage.getItem("logIn");
        if (!token) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." });
            navigate("/");
            return;
        }

        const fetchInitial = async () => {
            try {
                const resp = await api.get<OrderSummary[]>("/api/admin/orders/search");
                setOrders(resp.data);
                if (resp.data.length > 0) {
                    setSelectedOrderId(resp.data[0].id);
                }
            } catch (err: any) {
                console.error(err);
                if (err.response && err.response.status === 403) {
                    Swal.fire({ icon: "error", title: "권한 없음", text: "관리자만 접근할 수 있는 페이지입니다." });
                    navigate("/");
                    return;
                }
                Swal.fire({ icon: "error", title: "오류", text: "주문 목록을 불러오지 못했습니다." });
            }
        };

        fetchInitial();
    }, [navigate]);

    // 선택 주문이 바뀔 때마다 editStatus 초기화
    useEffect(() => {
        if (selectedOrder) {
            setEditStatus(selectedOrder.status ?? "");
        } else {
            setEditStatus("");
        }
    }, [selectedOrder]);

    // 검색 버튼 클릭 시 백엔드에 조건 전달
    const handleSearch = async () => {
        try {
            const params: any = {};
            if (buyerKeyword.trim()) params.buyerKeyword = buyerKeyword.trim();
            if (productKeyword.trim()) params.productKeyword = productKeyword.trim();
            if (orderIdInput.trim()) {
                const idNum = Number(orderIdInput.trim());
                if (!Number.isNaN(idNum)) {
                    params.orderId = idNum;
                }
            }

            const resp = await api.get<OrderSummary[]>("/api/admin/orders/search", {
                params,
            });

            setOrders(resp.data);
            setCurrentPage(1);
            if (resp.data.length > 0) {
                setSelectedOrderId(resp.data[0].id);
            } else {
                setSelectedOrderId(null);
            }
        } catch (err: any) {
            console.error(err);
            if (err.response && err.response.status === 403) {
                Swal.fire({ icon: "error", title: "권한 없음", text: "관리자만 접근할 수 있는 페이지입니다." });
                navigate("/");
                return;
            }
            Swal.fire({ icon: "error", title: "오류", text: "주문 목록을 불러오지 못했습니다." });
        }
    };

    // 프론트 쪽 추가 필터 (status, itemCount 범위)
    const filteredOrders = useMemo(() => {
        let list = [...orders];

        if (statusFilter !== "ALL") {
            list = list.filter((o) => o.status === statusFilter);
        }

        if (itemCountMin.trim()) {
            const min = Number(itemCountMin.trim());
            if (!Number.isNaN(min)) {
                list = list.filter((o) => o.itemCount >= min);
            }
        }

        if (itemCountMax.trim()) {
            const max = Number(itemCountMax.trim());
            if (!Number.isNaN(max)) {
                list = list.filter((o) => o.itemCount <= max);
            }
        }

        return list;
    }, [orders, statusFilter, itemCountMin, itemCountMax]);

    // 프론트 페이지네이션
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    const pagedOrders = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return filteredOrders.slice(start, end);
    }, [filteredOrders, currentPage]);

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handlePageChangeHelper = handlePageChange;

    const handleUpdateStatus = async () => {
        if (!selectedOrder || !editStatus || editStatus === selectedOrder.status) {
            return;
        }

        try {


            await api.post(`/api/admin/orders/${selectedOrder.id}/status`, {
                id: selectedOrder.id,
                status: editStatus,
            });

            setOrders((prev) =>
                prev.map((o) =>
                    o.id === selectedOrder.id ? {...o, status: editStatus} : o
                )
            );

            await Swal.fire({
                icon: "success",
                title: "성공!",
                text: "주문 상태를 변경했습니다.",
                timer: 1500,
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "실패",
                text: "주문 상태 변경에 실패했습니다.",
            });
        }
    };

    const renderPagination = () => {
        const pages = getPageNumbers();

        return (
            <div className="mt-3 d-flex justify-content-center">
            <nav>
                <ul className="pagination pagination-sm mb-0">
                    {/* 맨 앞 */}
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                            className="page-link"
                            onClick={() => setCurrentPage(1)}
                        >
                            «
                        </button>
                    </li>

                    {/* 이전 */}
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                        <button
                            className="page-link"
                            onClick={() =>
                                setCurrentPage((prev) => Math.max(1, prev - 1))
                            }
                        >
                            ‹
                        </button>
                    </li>

                    {/* 가운데 5개만 */}
                    {pages.map((num) => (
                        <li
                            key={num}
                            className={`page-item ${num === currentPage ? "active" : ""}`}
                        >
                            <button
                                className="page-link"
                                onClick={() => setCurrentPage(num)}
                            >
                                {num}
                            </button>
                        </li>
                    ))}

                    {/* 다음 */}
                    <li
                        className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                        }`}
                    >
                        <button
                            className="page-link"
                            onClick={() =>
                                setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1)
                                )
                            }
                        >
                            ›
                        </button>
                    </li>

                    {/* 맨 끝 */}
                    <li
                        className={`page-item ${
                            currentPage === totalPages ? "disabled" : ""
                        }`}
                    >
                        <button
                            className="page-link"
                            onClick={() => setCurrentPage(totalPages)}
                        >
                            »
                        </button>
                    </li>
                </ul>
            </nav>
            </div>
        );
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, itemCountMin, itemCountMax]);

    const buildProductSummary = (order: OrderSummary | null) => {
        if (!order || !order.productIds || !order.productTitles) {
            return null;
        }

        const idList = order.productIds.split(",").map((s) => s.trim()).filter(Boolean);
        const titleList = order.productTitles
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        if (idList.length === 0 || titleList.length === 0) return null;

        const firstId = idList[0];
        const firstTitle = titleList[0];
        const restCount = Math.max(idList.length, titleList.length) - 1;

        return {
            firstId: Number(firstId),
            firstTitle,
            restCount,
            idList: idList.map((id) => Number(id)),
            titleList,
        };
    };
    const productInfo = useMemo(
        () => buildProductSummary(selectedOrder),
        [selectedOrder]
    );


    return (
        <div className="container py-4">
            <h2 className="mb-4" style={{fontWeight: 700, color: "#0f172a"}}>
                주문 관리
            </h2>

            {/* 검색/필터 영역 */}
            <div
                className="mb-4 p-3"
                style={{
                    backgroundColor: "#f1f5f9",
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                }}
            >
                <div className="row g-2 align-items-end">
                    <div className="col-md-3">
                        <label className="form-label small text-muted">
                            구매자 (아이디 / 닉네임 / 이름)
                        </label>
                        <input
                            className="form-control form-control-sm"
                            value={buyerKeyword}
                            onChange={(e) => setBuyerKeyword(e.target.value)}
                            placeholder="예: userId, 닉네임, 이름"
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label small text-muted">
                            상품 제목
                        </label>
                        <input
                            className="form-control form-control-sm"
                            value={productKeyword}
                            onChange={(e) => setProductKeyword(e.target.value)}
                            placeholder="예: 후드티, 청바지"
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="form-label small text-muted">
                            주문 번호
                        </label>
                        <input
                            className="form-control form-control-sm"
                            value={orderIdInput}
                            onChange={(e) => setOrderIdInput(e.target.value)}
                            placeholder="정확한 주문번호"
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="form-label small text-muted">
                            상품 개수 (최소)
                        </label>
                        <input
                            className="form-control form-control-sm"
                            value={itemCountMin}
                            onChange={(e) => setItemCountMin(e.target.value)}
                            placeholder="예: 1"
                        />
                    </div>

                    <div className="col-md-2">
                        <label className="form-label small text-muted">
                            상품 개수 (최대)
                        </label>
                        <input
                            className="form-control form-control-sm"
                            value={itemCountMax}
                            onChange={(e) => setItemCountMax(e.target.value)}
                            placeholder="예: 10"
                        />
                    </div>
                </div>

                <div className="row g-2 align-items-end mt-2">
                    <div className="col-md-3">
                        <label className="form-label small text-muted">
                            주문 상태
                        </label>
                        <select
                            className="form-select form-select-sm"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">전체</option>
                            <option value="ORDER_CHECKING">주문확인중</option>
                            <option value="PREPARING">상품준비중</option>
                            <option value="SHIPPING">배송중</option>
                            <option value="DELIVERED">배송완료</option>
                            <option value="COMPLETED">구매확정</option>
                            <option value="CANCELLED">취소</option>
                            <option value="RETURNED">반품</option>
                            <option value="EXCHANGED">교환</option>
                        </select>
                    </div>

                    <div className="col-md-9 text-end">
                        <button
                            className="btn btn-primary btn-sm px-4"
                            onClick={handleSearch}
                        >
                            검색
                        </button>
                    </div>
                </div>
            </div>

            {/* 목록 + 상세 2단 레이아웃 */}
            <div className="row">
                {/* 주문 목록 */}

                <div className="col-lg-7 mb-4">
                    <div
                        className="card"
                        style={{borderRadius: 12, borderColor: "#e2e8f0"}}
                    >
                        <div className="card-header py-2 d-flex justify-content-between align-items-center">
                            <span className="small text-muted">
                                주문 목록 ({filteredOrders.length}건)
                            </span>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-sm mb-0 align-middle">
                                    <thead className="table-light">
                                    <tr>
                                        <th style={{width: 70}}>번호</th>
                                        <th>구매자</th>
                                        <th>받는 사람</th>
                                        <th>상태</th>
                                        <th>상품수</th>
                                        <th>총금액</th>
                                        <th>결제수단</th>
                                        <th style={{width: 70}}>보기</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {pagedOrders.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="text-center py-3 text-muted small"
                                            >
                                                조건에 맞는 주문이 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                    {pagedOrders.map((o) => (
                                        <tr
                                            key={o.id}
                                            onClick={() => setSelectedOrderId(o.id)}
                                            style={{
                                                cursor: "pointer"
                                            }}
                                            className={selectedOrderId === o.id ? 'table-active-selected' : ''}
                                        >
                                            <td>#{o.id}</td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                        <span className="fw-semibold">
                                                            {o.userId}
                                                        </span>
                                                    <span className={selectedOrderId === o.id ? "text-white-50 small" : "text-muted small"}>
                                                            {o.nickname}
                                                        </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column">
                                                    <span>{o.receiverName}</span>
                                                    <span className={selectedOrderId === o.id ? "text-white-50 small" : "text-muted small"}>
                                                            {o.phone}
                                                        </span>
                                                </div>
                                            </td>
                                            <td>
                                                    <span
                                                        className={selectedOrderId === o.id ? "badge bg-white text-primary" : getStatusBadgeClass(o.status)}
                                                    >
                                                        {
                                                            STATUS_LABELS[
                                                                o.status
                                                                ] || o.status
                                                        }
                                                    </span>
                                            </td>
                                            <td>{o.itemCount}</td>
                                            <td>{formatMoney(o.totalPrice)}</td>
                                            <td>{o.paymentMethod || "-"}</td>
                                            <td>
                                                <button
                                                    className={selectedOrderId === o.id ? "btn btn-sm btn-white text-primary fw-bold" : "btn btn-outline-secondary btn-sm"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedOrderId(o.id);
                                                    }}
                                                >
                                                    보기
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {renderPagination()}
                </div>

                {/* 주문 상세 헤더 + 상태 변경 */}
                <div className="col-lg-5">
                    <div
                        className="card"
                        style={{borderRadius: 12, borderColor: "#e2e8f0"}}
                    >
                        <div className="card-header py-2">
                            <span className="small text-muted">주문 상세</span>
                        </div>
                        <div className="card-body">
                            {!selectedOrder && (
                                <div className="text-muted small">
                                    왼쪽에서 주문을 선택해주세요.
                                </div>
                            )}

                            {selectedOrder && (
                                <>
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <h5 className="mb-0 fw-semibold">
                                                주문 #{selectedOrder.id}
                                            </h5>

                                            <span
                                                className={getStatusBadgeClass(
                                                    selectedOrder.status
                                                )}
                                            >
                                                {
                                                    STATUS_LABELS[
                                                        selectedOrder.status
                                                        ] || selectedOrder.status
                                                }
                                            </span>
                                        </div>
                                        {/*  id, title 외 n건 */}
                                        {productInfo && (
                                            <div className="small mt-1">
                                                <a
                                                    href={`/product/showOne/${productInfo.firstId}`}
                                                    style={{textDecoration: "none"}}
                                                >
                                                    {productInfo.firstId}, {productInfo.firstTitle}
                                                </a>
                                                {productInfo.restCount > 0 && (
                                                    <span className="text-muted">
                                                 {" "}
                                                        외 {productInfo.restCount}건
                                                 </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="text-muted small">
                                            {formatDateTime(selectedOrder.orderDate)}
                                        </div>
                                    </div>
                                    {productInfo && (
                                        <div className="mb-3 border-top pt-3 mt-3">
                                            <h6 className="fw-semibold small mb-2">주문 상품</h6>

                                            <div className="table-responsive">
                                                <table className="table table-sm align-middle mb-0">
                                                    <thead>
                                                    <tr>
                                                        <th style={{ width: 80 }}>상품ID</th>
                                                        <th>상품명</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {productInfo.idList.map((pid, idx) => (
                                                        <tr key={`${pid}-${idx}`}>
                                                            <td>#{pid}</td>
                                                            <td>
                                                                <a
                                                                    href={`/product/showOne/${pid}`}
                                                                    style={{ textDecoration: "none" }}
                                                                >
                                                                    {productInfo.titleList[idx] || ""}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <h6 className="fw-semibold small mb-1">
                                            구매자 정보
                                        </h6>
                                        <div className="small text-muted">
                                            <div>
                                                <strong>아이디:</strong>{" "}
                                                {selectedOrder.userId} (
                                                {selectedOrder.nickname})
                                            </div>
                                            <div>
                                                <strong>회원번호:</strong>{" "}
                                                {selectedOrder.memberId}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <h6 className="fw-semibold small mb-1">
                                            배송 정보
                                        </h6>
                                        <div className="small text-muted">
                                            <div>
                                                <strong>받는 사람:</strong>{" "}
                                                {selectedOrder.receiverName}
                                            </div>
                                            <div>
                                                <strong>연락처:</strong>{" "}
                                                {selectedOrder.phone}
                                            </div>
                                            <div>
                                                <strong>주소:</strong>{" "}
                                                {selectedOrder.address}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <h6 className="fw-semibold small mb-1">
                                            결제 / 금액
                                        </h6>
                                        <div className="small text-muted">
                                            <div>
                                                <strong>총 금액:</strong>{" "}
                                                {formatMoney(
                                                    selectedOrder.totalPrice
                                                )}
                                            </div>
                                            <div>
                                                <strong>상품 개수:</strong>{" "}
                                                {selectedOrder.itemCount}
                                            </div>
                                            <div>
                                                <strong>결제 수단:</strong>{" "}
                                                {selectedOrder.paymentMethod || "-"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-top pt-3 mt-2">
                                        <h6 className="fw-semibold small mb-2">
                                            주문 상태 변경
                                        </h6>
                                        <div className="d-flex gap-2 align-items-center">
                                            <select
                                                className="form-select form-select-sm"
                                                style={{maxWidth: 200}}
                                                value={editStatus}
                                                onChange={(e) =>
                                                    setEditStatus(
                                                        e.target.value as OrderStatus
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    상태 선택...
                                                </option>
                                                {STATUS_OPTIONS.map((opt) => (
                                                    <option
                                                        key={opt.value}
                                                        value={opt.value}
                                                    >
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={handleUpdateStatus}
                                                disabled={
                                                    !editStatus ||
                                                    !selectedOrder ||
                                                    editStatus ===
                                                    selectedOrder.status
                                                }
                                            >
                                                저장
                                            </button>
                                        </div>
                                        <div className="small text-muted mt-1">
                                            ※ 주문 상태는
                                            <br/>
                                            상품준비중 → 배송중 → 배송완료 →
                                            구매확정 / 취소 / 반품 / 교환 등으로
                                            변경할 수 있습니다.
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageOrderPage;

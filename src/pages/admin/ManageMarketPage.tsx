import {useEffect, useState, useCallback} from "react";
import Swal from "sweetalert2";
import api from "../../api/axiosInstance"; // 이미 쓰는 axios 인스턴스 유지
import {useNavigate} from "react-router-dom";
import {Pagination} from "react-bootstrap"; // spacing·typography 적용용 (선택)

// 타입 정의
interface Market {
    id: number;
    marketName: string;
    comment: string;
    link: string | null;

    productCount: number;
    onSaleCount: number;
    soldOutCount: number;
    wishCount: number;
    orderCount: number;
    totalSalesAmount: number;
    lastOrderDate: string | null;
}

interface MarketForm {
    marketName: string;
    comment: string;
    link: string;
}

interface MarketPageResponse {
    adMarketItems: Market[];
    totalPage: number;
    currentPage: number;
    startPage: number;
    endPage: number;
}


// PAGE_SIZE removed (not used)

const ManageMarketPage = () => {
    const [markets, setMarkets] = useState<Market[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const navigate = useNavigate();
    // 페이지네이션
    const [totalPage, setTotalPage] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(1);

    // 검색키워드
    const [keyword, setKeyword] = useState("");

    // 폼 상태
    const [formOpen, setFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"CREATE" | "EDIT">("CREATE");
    const [form, setForm] = useState<MarketForm>({
        marketName: "",
        comment: "",
        link: ""
    });
// 페이지 가져오기
    const fetchPage = useCallback(
        async (page: number) => {
            if (page < 1) return;

            const token = localStorage.getItem("logIn");
            if (!token) {
                Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." });
                navigate("/");
                return;
            }

            try {
                const resp = await api.get<MarketPageResponse>(
                    `/api/admin/market/showAll/${page}`,
                    {
                        params: {
                            keyword: keyword.trim() || undefined,   // 🔹 검색어 같이 전달
                        },
                    }
                );
                const data = resp.data;

                const items = data.adMarketItems ?? [];

                setMarkets(items);
                setTotalPage(data.totalPage);
                setCurrentPage(data.currentPage);
                setStartPage(data.startPage);
                setEndPage(data.endPage);

                if (items.length > 0 && selectedId === null) {
                    setSelectedId(items[0].id);
                }
            } catch (e) {
                console.error(e);
                Swal.fire("실패", "마켓 목록을 가져오지 못했습니다.", "error");
            }
        },
        [keyword, navigate, selectedId]
    );



    // 첫 로딩
    useEffect(() => {
        fetchPage(1);
    }, [fetchPage]);

// 🔹 keyword 변경 시 1페이지 재조회
// (입력할 때마다 바로바로 치는 게 부담되면, 나중에 '검색' 버튼 눌렀을 때만 호출하는 방식도 가능)


    // 폼 열기 - 등록
    const openCreateForm = () => {
        setFormMode("CREATE");
        setForm({
            marketName: "",
            comment: "",
            link: ""
        });
        setFormOpen(true);
    };

    // 폼 열기 - 수정
    const openEditForm = (m: Market) => {
        setFormMode("EDIT");
        setForm({
            marketName: m.marketName,
            comment: m.comment ?? "",
            link: m.link ?? ""
        });
        setSelectedId(m.id);
        setFormOpen(true);
    };

    // 폼 입력 핸들러
    const onChangeForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setForm({
            ...form,
            [name]: value
        });
    };

    // 등록 수행
    const createMarket = async () => {
        try {
            await api.post("/api/admin/market", form);
            Swal.fire("성공", "마켓을 등록했습니다!", "success");
            setFormOpen(false);
            fetchPage(currentPage);
        } catch (e) {
            console.error(e);
            Swal.fire("실패", "등록에 실패했습니다.", "error");
        }
    };

    // 수정 수행
    const updateMarket = async () => {
        if (selectedId == null) return;

        try {
            await api.post(`/api/admin/market/update/${selectedId}`, form);
            Swal.fire("성공", "수정 완료!", "success");
            setFormOpen(false);
            fetchPage(currentPage);
        } catch (e) {
            console.error(e);
            Swal.fire("실패", "수정 실패", "error");
        }
    };

    // 삭제
    const deleteMarket = async (id: number) => {
        const confirm = await Swal.fire({
            title: "정말 삭제할까요?",
            text: "삭제 시 해당 마켓 데이터가 완전히 사라집니다.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "삭제",
            cancelButtonText: "취소"
        });

        if (!confirm.isConfirmed) return;

        try {
            await api.post(`/api/admin/market/delete/${id}`);
            Swal.fire("삭제됨", "마켓 삭제 완료", "success");

            if (id === selectedId) setSelectedId(null);

            fetchPage(1);
        } catch (e) {
            console.error(e);
            Swal.fire("실패", "삭제 실패", "error");
        }
    };

    // 단일 조회
    const selectedMarket = markets.find((m) => m.id === selectedId);

    // 페이지네이션 렌더
    const renderPagination = () => {
        if (!totalPage || totalPage <= 1) {
            return null;
        }

        const pages = [];
        const realEndPage = Math.min(endPage, totalPage);
        for (let i = startPage; i <= realEndPage; i++) {
            pages.push(
                <Pagination.Item
                    key={i}
                    active={i === currentPage}
                    onClick={() => fetchPage(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }

        return (
            <div>
                <Pagination style={{display: "flex", gap: "8px", marginTop: "20px"}}>
                    <Pagination.First onClick={() => fetchPage(1)} disabled={currentPage === 1}/>
                    <Pagination.Prev onClick={() => fetchPage(currentPage - 1)} disabled={currentPage <= 1}/>
                    {pages}
                    <Pagination.Next onClick={() => fetchPage(currentPage + 1)} disabled={currentPage >= totalPage}/>
                    <Pagination.Last onClick={() => fetchPage(totalPage)}
                                     disabled={!totalPage || currentPage === totalPage}/>
                </Pagination>
            </div>
        )
            ;
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">마켓 관리</h2>
                <button className="btn btn-primary" onClick={openCreateForm}>+ 마켓 등록</button>
            </div>

            <div className="row g-4">
                <div className="col-lg-6">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <div className="d-flex mb-3 gap-2">
                                <div className="flex-grow-1">
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            placeholder="검색: 마켓명 / 링크 / 코멘트"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                            className="form-control"
                                        />
                                        <button className="btn btn-outline-secondary" onClick={() => fetchPage(1)}>검색</button>
                                    </div>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead>
                                    <tr>
                                        <th style={{width: 60}}>ID</th>
                                        <th>마켓명</th>
                                        <th>운영데이터</th>
                                        <th style={{width: 140}}>관리</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {markets.map((m) => (
                                        <tr key={m.id} className={selectedId === m.id ? 'table-active' : ''} onClick={() => setSelectedId(m.id)}>
                                            <td>{m.id}</td>
                                            <td style={{fontWeight: 600}}>{m.marketName}</td>
                                            <td style={{whiteSpace: 'pre-line'}}>
                                                상품 {m.productCount}개 / 주문 {m.orderCount}건 / 찜 {m.wishCount}회
                                                <br />
                                                매출 {(m.totalSalesAmount ?? 0).toLocaleString()}원
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-secondary me-2" onClick={(e) => { e.stopPropagation(); openEditForm(m); }}>수정</button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={(e) => { e.stopPropagation(); deleteMarket(m.id); }}>삭제</button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            {renderPagination()}
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title">상세 정보</h5>
                            {!selectedMarket ? (
                                <div className="text-muted">마켓을 선택하세요.</div>
                            ) : (
                                <div className="mt-3">
                                    <h3 className="mb-1">{selectedMarket.marketName}</h3>
                                    {selectedMarket.link && (
                                        <a href={selectedMarket.link} target="_blank" rel="noreferrer">{selectedMarket.link}</a>
                                    )}

                                    <p className="mt-3" style={{whiteSpace: 'pre-wrap'}}>{selectedMarket.comment}</p>

                                    <h6 className="mt-4">운영 데이터</h6>
                                    <ul className="list-unstyled" style={{lineHeight: 1.8}}>
                                        <li>전체 상품: {selectedMarket.productCount}개</li>
                                        <li>판매중: {selectedMarket.onSaleCount}개</li>
                                        <li>품절: {selectedMarket.soldOutCount}개</li>
                                        <li>찜: {selectedMarket.wishCount}회</li>
                                        <li>주문수: {selectedMarket.orderCount}건</li>
                                        <li>누적 매출: {(selectedMarket.totalSalesAmount ?? 0).toLocaleString()}원</li>
                                        <li>마지막 주문일: {selectedMarket.lastOrderDate ?? '없음'}</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 등록/수정 모달 (styled similarly to other modals) */}
            {formOpen && (
                <div className="modal-backdrop">
                    <div className="modal-panel p-4" style={{maxWidth: 640}}>
                        <h3>{formMode === "CREATE" ? "마켓 등록" : "마켓 수정"}</h3>

                        <div className="form-group mb-3">
                            <label className="form-label">마켓명</label>
                            <input name="marketName" value={form.marketName} onChange={onChangeForm} className="form-control" />
                        </div>

                        <div className="form-group mb-3">
                            <label className="form-label">링크(URL)</label>
                            <input name="link" value={form.link} onChange={onChangeForm} className="form-control" />
                        </div>

                        <div className="form-group mb-3">
                            <label className="form-label">코멘트</label>
                            <textarea name="comment" value={form.comment} onChange={onChangeForm} className="form-control" rows={4} />
                        </div>

                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-outline-secondary" onClick={() => setFormOpen(false)}>취소</button>
                            {formMode === "CREATE" ? (
                                <button className="btn btn-primary" onClick={createMarket}>등록</button>
                            ) : (
                                <button className="btn btn-primary" onClick={updateMarket}>저장</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ManageMarketPage;

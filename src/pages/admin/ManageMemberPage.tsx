import {useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../../api/axiosInstance";
import Swal from "sweetalert2";

type MemberRole = "ROLE_USER" | "ROLE_SELLER" | "ROLE_ADMIN";
type MemberState = "ACTIVE" | "BANNED";

interface Member {
    id: number;
    userId: string;
    nickname: string;
    grade: number;
    username: string;
    email: string;
    birthday: string | null;
    gender: string;
    address: string | null;
    phone: string | null;
    role: MemberRole;
    banned: boolean;
    marketId: number | null;
}

interface Market {
    marketId: number;
    marketName: string;
}

const PAGE_SIZE = 20;

const ManageMemberPage = () => {
    const navigate = useNavigate();
    const [loginUserId, setLoginUserId] = useState<number | null>(null);
    const FIRST_ADMIN = 2;

    const [members, setMembers] = useState<Member[]>([]);
    const [markets, setMarkets] = useState<Market[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // 필터
    const [searchKeyword, setSearchKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | MemberState>("ALL");

    // 각 멤버별 롤(grade) 수정값
    const [editGrades, setEditGrades] = useState<{ [id: number]: number }>({});
    const [editMarketIds, setEditMarketIds] = useState<{ [id: number]: number | undefined }>({});
    //pagi
    const [currentPage, setCurrentPage] = useState(1);

    // ---------------------------
    // 토큰 존재 여부만 체크 + 목록 로딩
    // ---------------------------
    useEffect(() => {
        const token = localStorage.getItem("logIn");
        if (!token) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." });
            navigate("/");
            return;
        }
        api.get("/api/member/me")
            .then(res => {
                setLoginUserId(res.data.id);

            })
            .catch(() => {
                Swal.fire({
                    icon: "error",
                    title: "에러",
                    text: "로그인 정보를 불러오는데 실패했습니다.",
                });
            });

        const fetchInitialData = async () => {
            try {
                // 멤버 목록 가져오기
                const memberResp = await api.get<Member[]>("/api/admin/member/list");
                setMembers(memberResp.data);

                // 마켓 목록 가져오기
                const marketResp = await api.get<Market[]>("/api/admin/market/list");
                setMarkets(marketResp.data);

            } catch (err: any) {
                console.error(err);

                if (err.response && err.response.status === 403) {
                    Swal.fire({ icon: "error", title: "권한 없음", text: "관리자만 접근할 수 있는 페이지입니다." });
                    navigate("/");
                    return;
                }

                Swal.fire({ icon: "error", title: "오류", text: "데이터를 불러오지 못했습니다." });
            }
        };

        fetchInitialData();
    }, [navigate]);
    const isProtected = (memberId: number) => {
        if (memberId === loginUserId) {
            Swal.fire({
                icon: "warning",
                title: "변경할 수 없습니다",
                text: "자기 자신은 변경할 수 없습니다.",
            });
            return true;
        }

        if (memberId === FIRST_ADMIN) {
            Swal.fire({
                icon: "warning",
                title: "변경 불가",
                text: "최초 관리자는 변경할 수 없습니다.",
            });
            return true;
        }

        return false;
    };

    // 선택된 멤버
    const selectedMember = useMemo(
        () => members.find((m) => m.id === selectedId) ?? null,
        [members, selectedId]
    );

    // 필터 적용된 목록
    const filteredMembers = useMemo(() => {
        const kw = searchKeyword.trim().toLowerCase();

        return members.filter((m) => {
            const keywordHit =
                !kw ||
                m.username.toLowerCase().includes(kw) ||
                m.email.toLowerCase().includes(kw) ||
                m.nickname.toLowerCase().includes(kw);

            const state: MemberState = m.banned ? "BANNED" : "ACTIVE";
            const statusHit =
                statusFilter === "ALL" ? true : state === statusFilter;

            return keywordHit && statusHit;
        });
    }, [members, searchKeyword, statusFilter]);
    useEffect(()=>{
        setCurrentPage(1);
    },[searchKeyword]);

    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
    const pagedMembers = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return filteredMembers.slice(start, end);

    }, [filteredMembers, currentPage]);
    // 상태 뱃지
    const getStatusBadge = (banned: boolean) => {
        const state: MemberState = banned ? "BANNED" : "ACTIVE";
        if (state === "ACTIVE") {
            return <span className="status active">● 활성</span>;
        }
        return <span className="status suspended">● 정지</span>;
    };

    // 역할 라벨 (grade → 텍스트)
    const getGradeLabel = (grade: number) => {
        if (grade === 1) return "고객";
        if (grade === 2) return "판매자";
        if (grade === 3) return "관리자";
        return `등급 ${grade}`;
    };

    // 필터 초기화
    const resetFilters = () => {
        setSearchKeyword("");
        setStatusFilter("ALL");
    };

    // ---------------------------
    // 기능 1: 정지 / 해제 (목록에서 관리)
    // ---------------------------
    const toggleBan = async (id: number) => {
        if (isProtected(id)) return;

        const target = members.find((m) => m.id === id);
        if (!target) return;

        const nextBanned = !target.banned;   // 여기서 현재값 기준으로 토글

        try {
            const resp = await api.post<Member>(
                `/api/admin/member/${id}/banned`,
                {banned: nextBanned}
            );
            const updated = resp.data;

            // state 갱신
            setMembers((prev) =>
                prev.map((m) => (m.id === id ? updated : m))
            );

            // 성공 알림
            await Swal.fire({
                icon: "success",
                title: nextBanned ? "정지 완료" : "해제 완료",
                text: nextBanned
                    ? `회원 ${updated.username} 계정을 정지했습니다.`
                    : `회원 ${updated.username} 계정 정지를 해제했습니다.`,
                timer: 1500,
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "실패!",
                text: "정지/해제 처리에 실패했습니다.",
            });
        }
    };


    // ---------------------------
    // 기능 2: 롤(grade) 수정 (목록에서 관리)
    // ---------------------------
    const saveRole = async (memberId: number) => {
        if (isProtected(memberId)) return;

        const member = members.find(m => m.id === memberId);
        if (!member) return;

        // Use the edited grade, or fall back to the member's current grade
        const currentSelectedGrade = editGrades[memberId];
        const gradeToSave = currentSelectedGrade !== undefined ? currentSelectedGrade : member.grade;

        // Use the edited market ID, or fall back to the member's current market ID
        // Note: m.marketId from backend could be null.
        const currentSelectedMarketId = editMarketIds[memberId];
        let marketIdToSave: number | null | undefined = undefined;

        if (gradeToSave === 2) { // If target role is SELLER
            if (currentSelectedMarketId !== undefined) {
                marketIdToSave = currentSelectedMarketId; // Use edited marketId
            } else {
                marketIdToSave = member.marketId; // Use existing marketId from member object
            }
        } else { // If target role is not SELLER, marketId should be null
            marketIdToSave = null;
        }

        // Validate marketId if role is SELLER
        if (gradeToSave === 2 && (marketIdToSave === undefined || marketIdToSave === null || marketIdToSave <= 0)) {
            Swal.fire({
                icon: "warning",
                title: "마켓 ID 필요",
                text: "셀러에게는 유효한 마켓 ID를 할당해야 합니다.",
            });
            return;
        }

        const payload: { grade: number; marketId?: number | null } = { grade: gradeToSave };
        // Only include marketId in payload if it's set or explicitly null for non-sellers
        if (marketIdToSave !== undefined) {
            payload.marketId = marketIdToSave;
        }


        // Only send the request if something actually changed
        // Check if grade or marketId (if applicable) has genuinely changed
        const gradeChanged = payload.grade !== member.grade;
        let marketIdChanged = false;
        if (payload.grade === 2) { // If target role is SELLER, check marketId change
            marketIdChanged = payload.marketId !== member.marketId;
        } else { // If target role is not SELLER, marketId should become null
            marketIdChanged = member.marketId !== null;
        }


        if (!gradeChanged && !marketIdChanged) {
            await Swal.fire({
                icon: "info",
                title: "변경 사항 없음",
                text: "역할 또는 마켓 ID에 변경 사항이 없습니다.",
                timer: 1500,
            });
            return;
        }

        try {
            const { data: updated } = await api.post<Member>(
                `/api/admin/member/${memberId}/role`,
                payload
            );

            setMembers((prev) =>
                prev.map((m) => (m.id === memberId ? updated : m))
            );

            // Clear edited states after successful save
            setEditGrades(prev => {
                const newState = { ...prev };
                delete newState[memberId];
                return newState;
            });
            setEditMarketIds(prev => {
                const newState = { ...prev };
                delete newState[memberId];
                return newState;
            });


            await Swal.fire({
                icon: "success",
                title: "성공!",
                text: "역할 및 마켓 정보를 변경했습니다.",
                timer: 1500,
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "실패!",
                text: "역할 및 마켓 정보 변경에 실패했습니다.",
            });
        }
    };

    // ---------------------------
    // 기능 3: 삭제 (목록에서 관리)
    // ---------------------------
    const deleteMember = async (id: number) => {
        if (isProtected(id)) return;
        const target = members.find((m) => m.id === id);
        if (!target) return;

        const result = await Swal.fire({
            title: "정말 삭제하시겠습니까?",
            text: `ID ${target.id} / ${target.username} 계정을 삭제합니다.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "네, 삭제할게요",
            cancelButtonText: "취소",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await api.post(`/api/admin/member/delete/${id}`);

            setMembers((prev) => prev.filter((m) => m.id !== id));

            await Swal.fire({
                icon: "success",
                title: "삭제 완료",
                text: "멤버가 삭제되었습니다.",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err: any) {
            console.error(err);

            const msg =
                err.response?.status === 403
                    ? "권한이 없습니다. (ADMIN만 삭제 가능)"
                    : "삭제 중 오류가 발생했습니다.";

            Swal.fire({
                icon: "error",
                title: "삭제 실패",
                text: msg,
            });
        }
    };



    const getPageNumbers = () => {
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);

        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }

        const pages: number[] = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    const renderPagination = () => {
        const pages = getPageNumbers();

        return (
            <nav className="mt-2 d-flex justify-content-center">
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

                    {/* 가운데 페이지 번호들 */}
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
                                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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
        );
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    return (
        <div className="admin-root">
            {/* 헤더 */}
            <header className="admin-header">
                <div className="admin-brand">관리자 멤버 관리</div>
            </header>

            {/* 메인 레이아웃 */}
            <main className="admin-main" style={{ gridTemplateColumns: "1fr" }}>
                {/* 멤버 목록 */}
                <section className="card" aria-label="멤버 목록">
                    <h2>멤버 목록</h2>

                    {/* 필터 영역 */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                        }}
                    >
                        <div className="filters">
                            <div>
                                <label htmlFor="keyword">
                                    검색 (이름 / 이메일 / 닉네임)
                                </label>
                                <input
                                    id="keyword"
                                    type="text"
                                    placeholder="홍길동 / user@example.com / 닉네임"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="status">상태</label>
                                <select
                                    id="status"
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value as "ALL" | MemberState)
                                    }
                                >
                                    <option value="ALL">전체</option>
                                    <option value="ACTIVE">활성</option>
                                    <option value="BANNED">정지</option>
                                </select>
                            </div>
                        </div>

                        <div className="actions">
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={resetFilters}
                            >
                                초기화
                            </button>
                            <button type="submit" className="btn btn-sm btn-primary">
                                조회
                            </button>
                        </div>
                    </form>

                    {/* 활성 필터 칩 */}
                    <div className="pill-group">
                        {searchKeyword.trim() && (
                            <span className="pill">
                                검색: {searchKeyword.trim()}
                            </span>
                        )}
                        {statusFilter !== "ALL" && (
                            <span className="pill">
                                상태: {statusFilter === "ACTIVE" ? "활성" : "정지"}
                            </span>
                        )}
                    </div>

                    {/* 테이블 */}
                    <div className="table-wrapper">
                        <table>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>이름</th>
                                <th>이메일</th>
                                <th>역할</th>
                                <th>상태</th>
                                <th>관리</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pagedMembers.map((m) => (
                                <tr key={m.id}>
                                    <td>{m.id}</td>
                                    <td>
                                        <strong>{m.username}</strong>
                                    </td>
                                    <td>{m.email}</td>
                                    <td>
                                        {getGradeLabel(m.grade)}
                                    </td>
                                    <td>{getStatusBadge(m.banned)}</td>
                                    <td>
                                        <div
                                            className="actions"
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            {/* 보기 (우측 패널 선택) */}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => setSelectedId(m.id)}
                                            >
                                                보기
                                            </button>

                                            {/* 역할 변경 (목록에서 관리) */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >
                                                <label
                                                    htmlFor={`grade-${m.id}`}
                                                    style={{
                                                        fontSize: "0.85rem",
                                                        color: "#64748b",
                                                    }}
                                                >
                                                    역할
                                                </label>

                                                    <select
                                                    id={`grade-${m.id}`}
                                                    value={editGrades[m.id] ?? m.grade}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        setEditGrades((prev) => ({
                                                            ...prev,
                                                            [m.id]: val,
                                                        }));
                                                    }}
                                                    style={{
                                                        padding: "4px 6px",
                                                        borderRadius: "6px",
                                                        border: "1px solid #cbd5e1",
                                                    }}
                                                >
                                                    <option value={1}>고객</option>
                                                    <option value={2}>판매자</option>
                                                    <option value={3}>관리자</option>
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => saveRole(m.id)}
                                                >
                                                    역할 저장
                                                </button>
                                            </div>

                                            {/* 마켓 선택은 역할 선택 박스 아래에 위치하도록 함 */}
                                            {(editGrades[m.id] ?? m.grade) === 2 && (
                                                <div style={{ marginTop: 8 }}>
                                                    <select
                                                        value={editMarketIds[m.id] ?? m.marketId ?? ""}
                                                        onChange={(e) => {
                                                            const marketId = e.target.value === '' ? undefined : Number(e.target.value);
                                                            setEditMarketIds(prev => ({ ...prev, [m.id]: marketId }));
                                                        }}
                                                        className="form-select form-select-sm"
                                                        style={{ minWidth: 140 }}
                                                    >
                                                        <option value="">마켓 선택</option>
                                                        {markets.map(market => (
                                                            <option key={market.marketId} value={market.marketId}>
                                                                {market.marketName}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* 정지 / 해제 (목록에서 관리) */}
                                            {/* 정지 / 해제 (목록에서 관리) */}
                                            <button
                                                type="button"
                                                className={m.banned ? "btn btn-sm btn-outline-success" : "btn btn-sm btn-outline-danger"}
                                                onClick={() => toggleBan(m.id)}
                                            >
                                                {m.banned ? "해제" : "정지"}
                                            </button>

                                            {/* 삭제 */}
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => deleteMember(m.id)}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {filteredMembers.length === 0 && (
                            <div className="empty">조건에 맞는 멤버가 없습니다.</div>
                        )}
                    </div>

                    {renderPagination()}
                </section>

                {/* 모달: 선택한 멤버 상세 정보 */}
                {selectedId !== null && selectedMember && (
                    <div className="modal-backdrop" onClick={() => setSelectedId(null)}>
                        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                <h3 style={{ margin: 0 }}>
                                    {selectedMember.username}{" "}
                                    <span className="tag">{getGradeLabel(selectedMember.grade)}</span>
                                </h3>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedId(null)}
                                    style={{ marginTop: 0 }}
                                />
                            </div>

                            <div className="detail" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                                <div className="row" style={{ marginBottom: "1rem" }}>
                                    <span className="meta">이메일</span>
                                    <strong>{selectedMember.email}</strong>
                                </div>

                                <div className="row" style={{ marginBottom: "1rem" }}>
                                    <span className="meta">상태</span>
                                    {getStatusBadge(selectedMember.banned)}
                                </div>

                                <div className="row" style={{ marginBottom: "1rem" }}>
                                    <span className="meta">닉네임</span>
                                    <span>{selectedMember.nickname}</span>
                                </div>

                                <div className="row" style={{ marginBottom: "1rem" }}>
                                    <span className="meta">연락처</span>
                                    <span>{selectedMember.phone ?? "-"}</span>
                                </div>

                                <div className="row" style={{ marginBottom: "1rem" }}>
                                    <span className="meta">주소</span>
                                    <span>{selectedMember.address ?? "-"}</span>
                                </div>

                                <div className="row" style={{ marginBottom: "1rem" }}>
                                    <span className="meta">성별</span>
                                    <span>{selectedMember.gender}</span>
                                </div>

                                {selectedMember.grade === 2 && (
                                    <div className="row" style={{ marginBottom: "1rem" }}>
                                        <span className="meta">마켓</span>
                                        <span>
                                            {markets.find(m => m.marketId === selectedMember.marketId)?.marketName ?? 'N/A'}
                                            ({selectedMember.marketId})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ManageMemberPage;

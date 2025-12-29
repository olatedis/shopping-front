import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Form, Button, Card, Pagination, Spinner } from "react-bootstrap";

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

const ShowAllProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filtered, setFiltered] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const [keyword, setKeyword] = useState("");
    const [category, setCategory] = useState("all");
    const [sortOption, setSortOption] = useState("latest");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12
    const [page, setPage] = useState(1);

    const DEFAULT_IMAGE = "http://localhost:8080/images/animated-icon-loading-19021458.gif";

    useEffect(() => {
        axios
            .get("http://localhost:8080/api/product/list")
            .then((res) => {
                setProducts(res.data);
                setFiltered(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // 필터 + 검색 + 정렬 처리
    useEffect(() => {
        let result = [...products];

        // 검색 적용
        if (keyword.trim() !== "") {
            const lower = keyword.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(lower) ||
                    p.category.toLowerCase().includes(lower) ||
                    p.marketName.toLowerCase().includes(lower)
            );
        }

        // 카테고리 필터 적용
        if (category !== "all") {
            result = result.filter((p) => p.category === category);
        }

        // 정렬 적용
        switch (sortOption) {
            case "priceAsc":
                result.sort((a, b) => a.sellPrice - b.sellPrice);
                break;

            case "priceDesc":
                result.sort((a, b) => b.sellPrice - a.sellPrice);
                break;

            case "viewDesc":
                result.sort((a, b) => b.viewCount - a.viewCount);
                break;

            case "latest":
                result.sort(
                    (a, b) =>
                        new Date(b.createDate).getTime() -
                        new Date(a.createDate).getTime()
                );
                break;

            default:
                break;
        }

        setFiltered(result);
        setCurrentPage(1)
        setPage(1)
    }, [keyword, category, sortOption, products]);

    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentItems = filtered.slice(indexOfFirst, indexOfLast);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const getPageNumbers = () => {
        let start = Math.max(1, page - 2);
        const end = Math.min(totalPages, start + 4);

        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }

        const pages = [];
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    if (loading) {
        return (
            <Container className="d-flex align-items-center justify-content-center min-vh-100">
                <Spinner animation="border" role="status" className="text-primary">
                    <span className="visually-hidden">로딩 중...</span>
                </Spinner>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <div className="mb-5">
                <h1 className="section-title mb-4">🛍️ 상품 목록</h1>

                {/* 검색 및 필터 섹션 */}
                <Row className="g-3 mb-4">
                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="fw-bold mb-2">상품 검색</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="상품명이나 카테고리를 입력하세요"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="rounded"
                            />
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="fw-bold mb-2">카테고리</Form.Label>
                            <Form.Select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="rounded"
                            >
                                <option value="all">전체</option>
                                <option value="여성의류">여성의류</option>
                                <option value="남성의류">남성의류</option>
                                <option value="기타">기타</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={4}>
                        <Form.Group>
                            <Form.Label className="fw-bold mb-2">정렬</Form.Label>
                            <Form.Select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="rounded"
                            >
                                <option value="latest">최신순</option>
                                <option value="priceAsc">가격 낮은순</option>
                                <option value="priceDesc">가격 높은순</option>
                                <option value="viewDesc">조회수 높은순</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>
            </div>

            {/* 상품 없음 */}
            {filtered.length === 0 ? (
                <div className="text-center py-5">
                    <h5 className="text-gray">검색 결과가 없습니다.</h5>
                </div>
            ) : (
                <>
                    {/* 상품 카드 그리드 */}
                    <Row className="g-4 mb-5">
                        {currentItems.map((p) => (
                            <Col key={p.id} xs={12} sm={6} md={4} lg={3}>
                                <Link to={`/product/showOne/${p.id}`} style={{ textDecoration: 'none' }}>
                                    <Card className="h-100 product-card">
                                        <Card.Img
                                            variant="top"
                                            src={
                                                p.image
                                                    ? `http://localhost:8080/images/${p.image.replace('=', '')}`
                                                    : DEFAULT_IMAGE
                                            }
                                            alt={p.title}
                                            style={{
                                                height: "200px",
                                                objectFit: "cover",
                                                borderRadius: "0.5rem"
                                            }}
                                        />
                                        <Card.Body className="p-3">
                                            <Card.Title className="product-name text-truncate">
                                                {p.title}
                                            </Card.Title>
                                            <div className="product-price mb-2">
                                                {p.sellPrice.toLocaleString()}원
                                            </div>
                                            <div className="d-flex justify-content-between text-gray small">
                                                <span>👁️ {p.viewCount}</span>
                                                <span>❤️ {p.wishCount}</span>
                                            </div>
                                            <div className="mt-2">
                                                <small className="badge badge-primary">{p.category}</small>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Link>
                            </Col>
                        ))}
                    </Row>

                    {/* 페이지네이션 */}
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center">
                            <Pagination>
                                <Pagination.Prev
                                    disabled={page === 1}
                                    onClick={() => {
                                        setPage(page - 1)
                                        setCurrentPage(currentPage - 1)
                                    }}
                                />

                                {getPageNumbers().map((num) => (
                                    <Pagination.Item
                                        key={num}
                                        active={num === page}
                                        onClick={() => {
                                            setPage(num)
                                            setCurrentPage(num)
                                        }}
                                    >
                                        {num}
                                    </Pagination.Item>
                                ))}

                                <Pagination.Next
                                    disabled={page === totalPages}
                                    onClick={() => {
                                        setPage(page + 1)
                                        setCurrentPage(currentPage + 1)
                                    }}
                                />
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

export default ShowAllProductsPage;

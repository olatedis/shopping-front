import React, { useState, useEffect } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';

interface Product {
    id: number;
    title: string;
    image: string;
    sellPrice: number;
}

const DEFAULT_IMAGE = "http://localhost:8080/images/animated-icon-loading-19021458.gif";

const RecentlyViewedProducts: React.FC<{ layout?: 'grid' | 'list' }> = ({ layout = 'grid' }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecentlyViewedProducts = async () => {
            const recentlyViewedIds = JSON.parse(localStorage.getItem('recentlyViewedProducts') || '[]');
            if (recentlyViewedIds.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.post('/api/product/list', recentlyViewedIds);
                setProducts(response.data);
            } catch (error) {
                console.error('최근 본 상품을 불러오는 중 오류 발생:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentlyViewedProducts();
    }, []);

    if (loading) {
        return <div>최근 본 상품을 불러오는 중...</div>;
    }

    if (products.length === 0) {
        return null; // 최근 본 상품이 없으면 아무것도 렌더링하지 않음
    }

    return (
        <div className="mt-5">
            <hr />
            <h4 className="mb-4">최근 본 상품</h4>
            {layout === 'grid' ? (
                <Row xs={1} md={2} lg={4} className="g-4">
                    {products.map((product) => (
                        <Col key={product.id}>
                            <Card className="h-100">
                                <Link to={`/product/showOne/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <Card.Img
                                        variant="top"
                                        src={product.image
                                            ? `http://localhost:8080/images/${product.image.replace('=', '')}`
                                            : DEFAULT_IMAGE}
                                        style={{ height: '150px', objectFit: 'cover' }}
                                    />
                                    <Card.Body>
                                        <Card.Title style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.title}</Card.Title>
                                        <Card.Text>{product.sellPrice.toLocaleString()}원</Card.Text>
                                    </Card.Body>
                                </Link>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <div className="list-group">
                    {products.map((product) => (
                        <Link key={product.id} to={`/product/showOne/${product.id}`} className="list-group-item list-group-item-action d-flex align-items-center" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <img
                                src={product.image ? `http://localhost:8080/images/${product.image.replace('=', '')}` : DEFAULT_IMAGE}
                                alt={product.title}
                                style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, marginRight: 16 }}
                            />
                            <div>
                                <div style={{ fontSize: '1rem', fontWeight: 600 }}>{product.title}</div>
                                <div className="text-muted">{product.sellPrice.toLocaleString()}원</div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentlyViewedProducts;

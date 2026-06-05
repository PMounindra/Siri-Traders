const reviews = [
  {
    name: "Aarti S.",
    rating: 5,
    text: "Fresh quality and quick delivery. The product matched the description exactly.",
  },
  {
    name: "Mohit K.",
    rating: 4,
    text: "Good packaging and worth the price. Would order again.",
  },
  {
    name: "Priya R.",
    rating: 5,
    text: "Arrived on time and in excellent condition. Smooth checkout too.",
  },
];

const DummyReviewsSection = ({ product }) => {
  return (
    <section className="pd-reviews">
      <div className="pd-reviews__header">
        <div>
          <h2 className="pd-reviews__title">Customer Reviews</h2>
          <p className="pd-reviews__subtitle">
            What shoppers are saying about {product.name}
          </p>
        </div>
        <span className="pd-reviews__count">
          {reviews.length} featured reviews
        </span>
      </div>

      <div className="pd-reviews__grid">
        {reviews.map((review) => (
          <article key={review.name} className="pd-reviews__card">
            <div className="pd-reviews__meta">
              <strong>{review.name}</strong>
              <span>{"★".repeat(review.rating)}</span>
            </div>
            <p>{review.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default DummyReviewsSection;

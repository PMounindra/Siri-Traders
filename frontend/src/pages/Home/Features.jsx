import { heroSectionData } from "../../assets/assets";
import "./Features.css";

const Features = () => {
  return (
    <section className="home-features">
      <div className="home-features__inner">
        <div className="home-features__grid">
          {heroSectionData.hero_features.map((feature, index) => (
            <div
              key={`${feature.title}-${index}`}
              className="home-features__item"
            >
              <div className="home-features__icon-wrap">
                <feature.icon className="home-features__icon" />
              </div>
              <div className="home-features__copy">
                <p className="home-features__title">{feature.title}</p>
                <p className="home-features__desc">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;

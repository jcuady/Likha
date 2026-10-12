import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type KeyboardEvent } from "react";
import { formatPHP } from "@/lib/currency";
import { insights, listings, services, type Listing, type ListingKey } from "@/lib/likha-content";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AgentWidget, MiniChart, RevenueChart } from "@/components/likha/charts";
import hero from "@/assets/likha_villa_hero.jpg";
import dream from "@/assets/likha_dream_house.jpg";
import community from "@/assets/likha_community.jpg";
import horizon from "@/assets/likha_horizon_house.jpg";
import logo from "@/assets/likha_logo_trimmed.png";
import mark from "@/assets/likha_mark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Likha: Own Metro Manila property without a whole unit",
      },
      {
        name: "description",
        content:
          "Likha pools money from Filipino investors to buy, manage, and rent out Metro Manila property. Get rental income monthly and an owned share of the building.",
      },
      { property: "og:title", content: "Likha: Own Metro Manila property without a whole unit" },
      {
        property: "og:description",
        content:
          "Rental income every month and an owned share of the building. Likha is opening early access to Filipino investors.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// Photographs are paired by listing key, so every card shows a different home
// and the carousel never repeats an image mid-rotation.
const photos: Record<ListingKey, string> = {
  "urban-edge": hero,
  "villa-redwood": dream,
  "cedar-pavilion": community,
  "horizon-house": horizon,
};

type Property = Listing & { image: string };

function Index() {
  const [activeInsight, setActiveInsight] = useState(1);
  const [slide, setSlide] = useState(0);
  const [selected, setSelected] = useState<Property | null>(null);
  const [info, setInfo] = useState<{ title: string; body: string } | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const showInfo = (
    title: string,
    body = "Likha is still in build. This page is a preview of the platform, and live accounts and investment services are not yet available.",
  ) => setInfo({ title, body });

  // WAI-ARIA tabs pattern: arrow keys move between tabs, and only the selected
  // tab stays in the tab order.
  const onTabKeyDown = (event: KeyboardEvent) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const count = insights.length;
    let next = activeInsight;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (activeInsight + 1) % count;
    else next = (activeInsight - 1 + count) % count;
    setActiveInsight(next);
    tabRefs.current[next]?.focus();
  };

  const visible: Property[] = [0, 1, 2]
    .map((offset) => listings[(slide + offset) % listings.length] as Listing)
    .map((listing) => ({ ...listing, image: photos[listing.key] }));

  return (
    <main className="site">
      <section className="hero" id="home">
        <img
          className="hero-photo"
          src={hero}
          width={1920}
          height={1280}
          alt="Modern concrete and glass villa beside a sunlit pool"
          fetchPriority="high"
        />
        <nav className="nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <span className="nav-dot" />
          <a href="#insights">How it works</a>
          <a className="nav-brand" href="#home" aria-label="Likha home">
            <img src={mark} alt="Likha" />
          </a>
          <a href="#tools">Portfolio</a>
          <span className="nav-dot" />
          <a href="#contact">Contact</a>
        </nav>
        <div className="hero-copy">
          <p className="hero-eyebrow">LIKHA · METRO MANILA PROPERTY</p>
          <h1>
            Own Metro Manila property
            <br />
            without buying <em>a whole unit</em>
          </h1>
          <Button variant="premium" asChild>
            <a href="#properties">
              Join the early list <span className="arrow">↗</span>
            </a>
          </Button>
          <p className="hero-sub">
            Likha pools money from Filipino investors to buy, manage, and rent out real property.
            You collect rent every month and own a share of the building.
          </p>
        </div>
        <div className="occupancy">
          <div className="widget-label">
            <span>Occupancy rate</span>
            <span>···</span>
          </div>
          <div className="occupancy-body">
            {/* Headline is rented (62) + reserved (25). It previously read 74,
                which matched neither the legend nor the ring segments. */}
            <div className="donut">
              <strong>
                87<small>percent</small>
              </strong>
            </div>
            <div className="donut-legend">
              <div>
                Rented<b>62%</b>
              </div>
              <div>
                Reserved<b>25%</b>
              </div>
              <div>
                Available<b>13%</b>
              </div>
            </div>
          </div>
        </div>
        <AgentWidget />
        <div className="hero-brand">
          <img src={logo} alt="Likha" />
          <span>Property investing, open to more Filipinos.</span>
        </div>
      </section>

      <div className="content">
        <section className="insights" id="insights">
          <div className="pills">
            <span className="pill">How it works</span>
            <span className="pill pink">Property data</span>
          </div>
          <div className="section-heading">
            <h2>
              See what a property is
              <br />
              <em>really worth</em>
            </h2>
            <p>
              Neighborhood pricing, rental demand, and building performance for every property Likha
              lists. You see the numbers before you put money in.
            </p>
          </div>
          <div className="insight-tool">
            <div className="insight-list" role="tablist" aria-label="Property insights">
              {insights.map((item, i) => (
                <Button
                  key={item.title}
                  role="tab"
                  aria-selected={activeInsight === i}
                  aria-controls="insight-chart"
                  id={`insight-tab-${i}`}
                  tabIndex={activeInsight === i ? 0 : -1}
                  variant="ghost"
                  className={`insight-choice ${activeInsight === i ? "selected" : ""}`}
                  onClick={() => setActiveInsight(i)}
                  onKeyDown={onTabKeyDown}
                  ref={(node: HTMLButtonElement | null) => {
                    tabRefs.current[i] = node;
                  }}
                >
                  <h3>
                    <span className="insight-number">0{i + 1}</span>
                    {item.title}
                  </h3>
                  <p>{item.body}</p>
                </Button>
              ))}
            </div>
            <div
              className="chart-stage"
              role="tabpanel"
              id="insight-chart"
              aria-labelledby={`insight-tab-${activeInsight}`}
              tabIndex={0}
            >
              <RevenueChart mode={activeInsight} />
            </div>
          </div>
        </section>

        <section className="featured" id="properties">
          <div className="center-heading">
            <h2>
              Properties on the
              <br />
              <em>list right now</em>
            </h2>
            <p>Every listing shows the rent, the yield, and the neighborhood data behind it.</p>
          </div>
          <div className="properties">
            {visible.map((property) => (
              <article className="property-card" key={property.name}>
                <div className="property-image">
                  <img
                    src={property.image}
                    width={1400}
                    height={1045}
                    loading="lazy"
                    alt={`${property.name} in ${property.location}`}
                  />
                  <span className={`status ${property.status === "Under Offer" ? "offer" : ""}`}>
                    {property.status}
                  </span>
                </div>
                <div className="property-copy">
                  <h3>
                    {property.name}, {property.location}
                  </h3>
                  <p>{property.description}</p>
                  <div className="property-bottom">
                    <div className="property-price">
                      {formatPHP(property.rent)}
                      <span>/month</span>
                    </div>
                    <Button
                      variant="premium"
                      aria-label={`See details for ${property.name} in ${property.location}`}
                      onClick={() => setSelected(property)}
                    >
                      See details <span className="arrow">↗</span>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="carousel-controls">
            <Button
              variant="circle"
              size="icon"
              aria-label="Previous properties"
              onClick={() => setSlide((s) => (s + listings.length - 1) % listings.length)}
            >
              <span className="arrow">‹</span>
            </Button>
            <Button
              variant="circle"
              size="icon"
              aria-label="Next properties"
              onClick={() => setSlide((s) => (s + 1) % listings.length)}
            >
              <span className="arrow">›</span>
            </Button>
          </div>
          <p className="sr-only" aria-live="polite">
            Showing properties {slide + 1} to {slide + 3} of {listings.length}
          </p>
          <span className="collection-link">
            {listings.length} properties · updated October 2026
          </span>
        </section>

        <section className="dream">
          <img
            className="dream-image"
            src={dream}
            width={1536}
            height={1024}
            alt="Cantilevered modern villa overlooking the coast"
            loading="lazy"
          />
          <h2>
            You put in the money.
            <br />
            <em>We do the landlord work.</em>
          </h2>
          <div className="dream-services">
            {services.map((s, i) => (
              <article key={s.title} className="dream-service">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <Button
                  variant="ghost"
                  className="service-link"
                  onClick={() => {
                    setActiveInsight(i);
                    document.getElementById("insights")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  See the data <span className="arrow">↗</span>
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section className="tools" id="tools">
          <div className="center-heading">
            <span className="pill pink">Your portfolio</span>
            <h2>
              One account.
              <br />
              <em>Every property you own.</em>
            </h2>
            <p>
              Rent coming in, expenses going out, and what your share is worth. Updated monthly, in
              plain numbers.
            </p>
          </div>
          <div className="tools-grid">
            <article className="tool-card">
              <h3>Your dashboard</h3>
              <p>
                Every property, rent collected, and running total in a single view.
                <br />
                <br />
              </p>
              <MiniChart />
            </article>
            <article className="tool-card collaboration">
              <h3>Invest with people you know</h3>
              <p>
                Pool with family or friends into the same property and split the shares cleanly.
              </p>
              <div className="globe" aria-hidden="true">
                <div className="globe-ball">
                  {Array.from({ length: 5 }, (_, i) => (
                    <i key={i} />
                  ))}
                </div>
              </div>
              <div className="person-tag person-one">
                <span className="avatar" aria-hidden="true">
                  RW
                </span>
                Robert Wilson
              </div>
              <div className="person-tag person-two">
                <span className="avatar" aria-hidden="true">
                  JD
                </span>
                Jennifer Davis
              </div>
              <div className="person-tag person-three">
                <span className="avatar" aria-hidden="true">
                  ET
                </span>
                Elizabeth Taylor
              </div>
            </article>
            <article className="tool-card sustainable">
              <span className="pill">Lower running costs</span>
              <h3>
                Newer buildings
                <br />
                cost less to run.
              </h3>
              <p>
                Green buildings cut utility bills and hold rents better in a tight market.
                <br />
              </p>
              <img
                src={community}
                width={1024}
                height={1536}
                alt="Sustainable modern villas with green roofs in a mountain landscape"
                loading="lazy"
              />
              <span className="price-tag price-one">{formatPHP(9200000)}</span>
              <span className="price-tag price-two">{formatPHP(8325000)}</span>
              <span className="price-tag price-three">{formatPHP(9590000)}</span>
            </article>
            <article className="tool-card empire">
              <div className="empire-text">
                <h3>
                  Start with one
                  <br />
                  property.
                </h3>
                <p>Add another whenever you want. Same dashboard, same statements, same manager.</p>
                <Button variant="premium" asChild>
                  <a href="#properties">
                    Join the early list <span className="arrow">↗</span>
                  </a>
                </Button>
              </div>
              <div className="agents-panel">
                <div className="agents-panel-title">Recent closings</div>
                <AgentWidget name="Emily Gray" amount={421376} />
                <AgentWidget />
              </div>
            </article>
          </div>
        </section>

        <footer className="footer" id="contact">
          <div className="footer-main">
            <div className="footer-brand">
              <a href="#home">
                <img src={logo} width={350} height={105} alt="Likha" loading="lazy" />
              </a>
              <p>
                Metro Manila property,
                <br />
                owned in pieces.
              </p>
              <div className="footer-social">
                <a
                  href="#contact"
                  aria-label="Likha on X"
                  onClick={(e) => {
                    e.preventDefault();
                    showInfo("Connect with Likha", "Our social channels open when Likha launches.");
                  }}
                >
                  <span aria-hidden="true">𝕏</span>
                </a>
                <a
                  href="#contact"
                  aria-label="Likha on Instagram"
                  onClick={(e) => {
                    e.preventDefault();
                    showInfo("Connect with Likha", "Our social channels open when Likha launches.");
                  }}
                >
                  <span aria-hidden="true">ig</span>
                </a>
                <a
                  href="#contact"
                  aria-label="Likha on LinkedIn"
                  onClick={(e) => {
                    e.preventDefault();
                    showInfo("Connect with Likha", "Our social channels open when Likha launches.");
                  }}
                >
                  <span aria-hidden="true">in</span>
                </a>
              </div>
            </div>
            <div className="footer-column">
              <h4>Products</h4>
              {[
                "Investment Finder",
                "Rental Yield Calculator",
                "Portfolio Manager",
                "Market Insights",
                "Property Collections",
              ].map((label) => (
                <a
                  key={label}
                  href={
                    label === "Investment Finder" || label === "Property Collections"
                      ? "#properties"
                      : label === "Portfolio Manager"
                        ? "#tools"
                        : "#insights"
                  }
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              {[
                "Investor Stories",
                "Property Investment Guide",
                "Market Reports",
                "Help Center",
              ].map((label) => (
                <a
                  key={label}
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    showInfo(label);
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#tools">About Likha</a>
              {["Partnerships", "Careers", "Contact Us"].map((label) => (
                <a
                  key={label}
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    showInfo(label);
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div className="footer-bottom">
            <div>
              {["Terms of Use", "Privacy Policy"].map((label) => (
                <a
                  href="#contact"
                  key={label}
                  onClick={(e) => {
                    e.preventDefault();
                    showInfo(
                      label,
                      "Likha is a preview. Final terms and privacy information are published before launch.",
                    );
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
            <span>© 2026 Likha. All rights reserved.</span>
          </div>
          <p className="preview-note">
            This is a preview of Likha. Properties, people, prices, and returns shown here are
            examples only, not live investment offers. Likha is not yet accepting investments.
          </p>
        </footer>
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="property-dialog">
          {selected && (
            <>
              <img
                src={selected.image}
                className="detail-photo"
                alt={`${selected.name} in ${selected.location}`}
              />
              <DialogTitle className="detail-title">{selected.name}</DialogTitle>
              <DialogDescription className="detail-description">
                {selected.location} · {selected.description}
              </DialogDescription>
              <div className="detail-facts">
                <div>
                  <span>Bedrooms</span>
                  <strong>{selected.beds}</strong>
                </div>
                <div>
                  <span>Interior space</span>
                  <strong>{selected.area} sq ft</strong>
                </div>
                <div>
                  <span>Illustrative yield</span>
                  <strong>{selected.yield}</strong>
                </div>
              </div>
              <div className="property-bottom">
                <div className="property-price">
                  {formatPHP(selected.rent)}
                  <span>/month</span>
                </div>
                <span className={`pill ${selected.status === "Under Offer" ? "pink" : ""}`}>
                  {selected.status}
                </span>
              </div>
              <p className="detail-note">
                This is a sample listing with generated imagery and example pricing. Live
                availability, investment terms, and enquiries open when Likha launches.
              </p>
              <Button variant="premium" onClick={() => setSelected(null)}>
                Back to the list <span className="arrow">↗</span>
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={info !== null}
        onOpenChange={(open) => {
          if (!open) setInfo(null);
        }}
      >
        <DialogContent className="info-dialog">
          <DialogTitle>{info?.title}</DialogTitle>
          <DialogDescription>{info?.body}</DialogDescription>
          <Button variant="premium" onClick={() => setInfo(null)}>
            Back to Likha
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

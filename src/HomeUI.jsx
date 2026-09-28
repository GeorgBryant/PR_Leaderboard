export default function HomeUI({
  onStart,
}) {
  return (
    <div className="home-ui">
<button
        className="home-ui__start"
        onClick={onStart}
      >
        <span>START</span>
        <span
          className="home-ui__start-arrow"
          aria-hidden="true"
        >
          →
        </span>
      </button>
    </div>
  );
}
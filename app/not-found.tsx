import Link from "next/link";

export default function NotFound() {
  return (
    <div className="tw-frame">
      <div className="tw-body">
        <h1>Not here</h1>
        <p className="tw-lede" style={{ marginTop: 10 }}>There is no page at this address.</p>
        <Link className="tw-btn" href="/" style={{ display: "inline-block", marginTop: 16 }}>Home</Link>
      </div>
    </div>
  );
}

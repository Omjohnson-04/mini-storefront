import Catelog from "./components/Catelog";

export default function Page() {
    return <Catelog apiBase="/api" pollMs={10000} />;
}
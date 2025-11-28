import ClassroomDetailClient from "./ClassroomDetailClient";

export default async function ClassroomDetailPage({ params }) {
    const { id } = await params;
    return <ClassroomDetailClient classroomId={id} />;
}

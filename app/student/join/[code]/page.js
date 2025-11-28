import JoinClassroomClient from "./JoinClassroomClient";

export default async function JoinClassroomPage({ params }) {
    const { code } = await params;
    return <JoinClassroomClient inviteCode={code} />;
}

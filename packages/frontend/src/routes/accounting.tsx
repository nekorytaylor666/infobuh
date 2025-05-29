import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/accounting')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/accounting"!</div>
}

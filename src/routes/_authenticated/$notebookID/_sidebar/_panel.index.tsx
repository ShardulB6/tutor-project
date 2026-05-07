import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_authenticated/$notebookID/_sidebar/_panel/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    
  </div>
}

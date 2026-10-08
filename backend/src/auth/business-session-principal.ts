/** Static SQL expressions only; request input is always passed as parameters. */
export function businessSessionPrincipalSql(
  userId: 's.user_id' | '$2::uuid',
  administratorId: 's.impersonated_by_platform_admin_id' | '$8::uuid',
): string {
  return `(
    (${administratorId} IS NOT NULL AND EXISTS
      (SELECT 1 FROM platform_admins admin WHERE admin.id=${administratorId}))
    OR (${administratorId} IS NULL AND EXISTS
      (SELECT 1 FROM business_memberships membership
       JOIN users owner ON owner.id=membership.user_id AND owner.status='active'
       WHERE membership.business_id=a.id AND membership.user_id=${userId}
         AND membership.status='active'))
  )`;
}

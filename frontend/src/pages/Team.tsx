import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TeamCollaborationPanel } from '../components/team/TeamCollaborationPanel';

export function Team() {
  return (
    <PageContainer
      title="Team Security Collaboration & Task Management"
      description="Assign vulnerability findings, manage security analyst roles, and collaborate on code remediation"
    >
      <div className="max-w-6xl mx-auto">
        <TeamCollaborationPanel />
      </div>
    </PageContainer>
  );
}
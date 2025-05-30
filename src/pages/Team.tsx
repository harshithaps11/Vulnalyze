import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { TeamCollaborationPanel } from '../components/team/TeamCollaborationPanel';
import { Button } from '../components/ui/Button';
import { UserPlus } from 'lucide-react';

export function Team() {
  return (
    <PageContainer
      title="Team Collaboration"
      description="Work together to identify and fix security vulnerabilities"
      actions={
        <Button 
          variant="primary" 
          size="sm"
          icon={<UserPlus size={16} />}
        >
          Invite Team Member
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto">
        <TeamCollaborationPanel />
      </div>
    </PageContainer>
  );
}
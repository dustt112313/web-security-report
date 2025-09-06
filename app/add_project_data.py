import sys
sys.path.append('.')
from db.connection import get_db
from db.models import (
    Project, AssessmentTarget, AssessmentScope, CollectedInformation,
    Bug, AffectedObject, Recommendation, BugImage, CVEInformation
)
from datetime import datetime

db = next(get_db())

# Add assessment targets
targets_data = [
    {'target_name': 'Web Application', 'project_id': 56},
    {'target_name': 'Mobile App', 'project_id': 56},
    {'target_name': 'API Server', 'project_id': 56}
]

for target_data in targets_data:
    target = AssessmentTarget(**target_data)
    db.add(target)

db.commit()
print('Added assessment targets')

# Get target IDs for reference
targets = db.query(AssessmentTarget).filter(AssessmentTarget.project_id == 56).all()
target_ids = [t.id for t in targets]

# Add assessment scopes
scopes_data = [
    {'doituong': 'Authentication System', 'thongtin': 'Login, logout, session management', 'project_id': 56},
    {'doituong': 'User Management', 'thongtin': 'User registration, profile management', 'project_id': 56},
    {'doituong': 'Data Processing', 'thongtin': 'File upload, data validation', 'project_id': 56}
]

for scope_data in scopes_data:
    scope = AssessmentScope(**scope_data)
    db.add(scope)

db.commit()
print('Added assessment scopes')

# Add collected information
info_data = [
    {'information': 'React.js frontend with TypeScript', 'project_id': 56},
    {'information': 'Node.js backend with Express framework', 'project_id': 56},
    {'information': 'PostgreSQL database with sensitive user data', 'project_id': 56},
    {'information': 'JWT authentication implementation', 'project_id': 56}
]

for info in info_data:
    collected_info = CollectedInformation(**info)
    db.add(collected_info)

db.commit()
print('Added collected information')

# Add bugs
bugs_data = [
    {
        'vulnerability_heading': 'SQL Injection in Login Form',
        'severity_text': 'Cao',
        'description': 'The login form is vulnerable to SQL injection attacks due to improper input validation.',
        'recommendation_content': 'Implement parameterized queries and input validation.',
        'bug_type': 'ungdung',
        'project_id': 56,
        'target_id': target_ids[0]
    },
    {
        'vulnerability_heading': 'Cross-Site Scripting (XSS)',
        'severity_text': 'Trung Bình',
        'description': 'User input is not properly sanitized, allowing XSS attacks.',
        'recommendation_content': 'Implement proper input sanitization and output encoding.',
        'bug_type': 'ungdung',
        'project_id': 56,
        'target_id': target_ids[1]
    },
    {
        'vulnerability_heading': 'Hardcoded API Keys',
        'severity_text': 'Cao',
        'description': 'API keys are hardcoded in the source code.',
        'recommendation_content': 'Move sensitive data to environment variables.',
        'bug_type': 'manguon',
        'project_id': 56,
        'target_id': target_ids[2]
    }
]

for bug_data in bugs_data:
    bug = Bug(**bug_data)
    db.add(bug)

db.commit()
print('Added bugs')

# Get bug IDs for reference
bugs = db.query(Bug).filter(Bug.project_id == 56).all()
bug_ids = [b.id for b in bugs]

# Add affected objects
affected_objects_data = [
    {'object_url': '/login', 'bug_id': bug_ids[0]},
    {'object_url': '/api/auth', 'bug_id': bug_ids[0]},
    {'object_url': '/profile', 'bug_id': bug_ids[1]},
    {'object_url': '/comments', 'bug_id': bug_ids[1]},
    {'object_url': 'config.js', 'bug_id': bug_ids[2]},
    {'object_url': 'api-keys.js', 'bug_id': bug_ids[2]}
]

for obj_data in affected_objects_data:
    affected_obj = AffectedObject(**obj_data)
    db.add(affected_obj)

db.commit()
print('Added affected objects')

# Add recommendations
recommendations_data = [
    {'recommendation_text': 'Use prepared statements for all database queries', 'bug_id': bug_ids[0]},
    {'recommendation_text': 'Implement input validation using whitelist approach', 'bug_id': bug_ids[0]},
    {'recommendation_text': 'Sanitize all user inputs before displaying', 'bug_id': bug_ids[1]},
    {'recommendation_text': 'Use Content Security Policy (CSP) headers', 'bug_id': bug_ids[1]},
    {'recommendation_text': 'Store API keys in environment variables', 'bug_id': bug_ids[2]},
    {'recommendation_text': 'Use secret management tools like HashiCorp Vault', 'bug_id': bug_ids[2]}
]

for rec_data in recommendations_data:
    recommendation = Recommendation(**rec_data)
    db.add(recommendation)

db.commit()
print('Added recommendations')

# Add CVE Information
cve_data = [
    {'library': 'express', 'cve': 'CVE-2022-24999', 'latest_version': '4.18.2', 'bug_id': bug_ids[0]},
    {'library': 'react', 'cve': 'CVE-2021-44906', 'latest_version': '18.2.0', 'bug_id': bug_ids[1]},
    {'library': 'node', 'cve': 'CVE-2023-30581', 'latest_version': '18.17.0', 'bug_id': bug_ids[2]}
]

for cve in cve_data:
    cve_info = CVEInformation(**cve)
    db.add(cve_info)

db.commit()
print('Added CVE information')

print('\nProject 56 data summary:')
print(f'Targets: {len(targets_data)}')
print(f'Scopes: {len(scopes_data)}')
print(f'Info: {len(info_data)}')
print(f'Bugs: {len(bugs_data)}')
print(f'Affected Objects: {len(affected_objects_data)}')
print(f'Recommendations: {len(recommendations_data)}')
print(f'CVE Info: {len(cve_data)}')
print('All data added successfully!')
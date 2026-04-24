/**
 * Translate Turkish values in en.json to proper English
 */
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

function setNestedValue(obj, keyPath, value) {
    const parts = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

// HR translations (copied from TR, need English)
const translations = {
    "HR.title": "HR (Personnel Management)",
    "HR.description": "Company personnel, personal files and asset management.",
    "HR.newEmployee": "Add New Employee",
    "HR.stats.total": "Total Personnel",
    "HR.stats.active": "Active Employees",
    "HR.stats.passive": "Inactive/Resigned",
    "HR.table.name": "Full Name",
    "HR.table.department": "Department",
    "HR.table.role": "Title",
    "HR.table.status": "Status",
    "HR.table.actions.title": "Actions",
    "HR.table.actions.edit": "Edit",
    "HR.table.sicilNo": "Registry No",
    "HR.table.phone": "Phone",
    "HR.table.empty": "No personnel records found.",
    "HR.form.personalInfo": "Personal Information",
    "HR.form.jobInfo": "Job Information",
    "HR.form.firstName": "First Name",
    "HR.form.lastName": "Last Name",
    "HR.form.email": "Email",
    "HR.form.phone": "Phone",
    "HR.form.sicilNo": "Registry/ID No",
    "HR.form.department": "Department",
    "HR.form.role": "Title",
    "HR.form.region": "Region/Branch",
    "HR.form.hireDate": "Hire Date",
    "HR.form.salary": "Salary",
    "HR.form.manager": "Manager",
    "HR.form.crmUser": "CRM User Mapping",
    "HR.form.active": "Active",
    "HR.form.passive": "Inactive",
    "HR.form.save": "Save Employee",
    "HR.form.saveDocument": "Save Document",
    "HR.form.cancel": "Cancel",
    "HR.form.selectManager": "Select Manager...",
    "HR.form.selectUser": "Select CRM User...",
    "HR.form.uploadPhoto": "Upload Photo",
    "HR.form.addDocument": "Add Document",
    "HR.form.documentName": "Document Name",
    "HR.form.file": "File",
    "HR.form.noDocuments": "No documents added yet.",
    "HR.form.assetsLabel": "Assigned Assets (Delivered)",
    "HR.form.status": "Status",
    "HR.form.currency": "Currency",
    "HR.form.terminationDate": "Termination Date",
    "HR.form.photo": "Employee Photo",
    "HR.form.changePhoto": "Change Photo",
    "HR.form.selectPhoto": "Select Photo",
    "HR.form.uploading": "Uploading...",
    "HR.assets.laptop": "Laptop",
    "HR.assets.car": "Vehicle",
    "HR.assets.phone": "Phone & Line",
    "HR.assets.peripherals": "Laptop bag + mouse",
    "HR.messages.successCreate": "Employee record created successfully.",
    "HR.messages.successUpdate": "Employee information updated.",
    "HR.messages.successDelete": "Employee record deleted.",
    "HR.messages.confirmDelete": "Are you sure you want to delete this employee? This action cannot be undone.",
    "HR.messages.error": "An error occurred.",
    "HR.tabs.personal": "Personal Information",
    "HR.tabs.assets": "Assigned Assets",
    "HR.tabs.documents": "Documents",
    "HR.searchPlaceholder": "Search personnel...",
    "HR.noEmployees": "No personnel records found.",
    "HR.addFirst": "Start by adding the first employee.",
    "HR.status": "Status",

    // AiFeaturesSection
    "AiFeaturesSection.badge": "NEXT-GEN INTELLIGENCE",
    "AiFeaturesSection.title": "More Than a Digital",
    "AiFeaturesSection.titleHighlight": "Sales Assistant",
    "AiFeaturesSection.description": "Novo CRM doesn't just store data; it analyzes it, detects risks, and delivers custom strategies to your sales team every morning.",
    "AiFeaturesSection.features.copilot.title": "AI Co-Pilot & Daily Briefing",
    "AiFeaturesSection.features.copilot.desc": "An intelligence that greets you every morning. It tracks overdue payments, untouched hot leads, and low-stock projects on your behalf.",
    "AiFeaturesSection.features.voice.title": "Voice-to-Data",
    "AiFeaturesSection.features.voice.desc": "Forget the keyboard. Leave a voice recording after a customer meeting, and the AI will parse all the details and convert them into a CRM record in seconds.",
    "AiFeaturesSection.features.match.title": "Smart Property Matching & Sales Pitch",
    "AiFeaturesSection.features.match.desc": "Which of your thousands of units is the best fit for this customer? AI finds it, explains why, and prepares a personalized pitch to convince the customer.",
    "AiFeaturesSection.features.audit.title": "Operational Financial Guardian",
    "AiFeaturesSection.features.audit.desc": "Overdue installments or missing contract documents... AI detects risks before they grow and proactively alerts the team.",

    // Campaigns (copied from TR to EN, some may have TR text)
    "Campaigns.title": "Incentive & Bonus Campaigns",
    "Campaigns.description": "Manage active and future campaigns to boost broker performance.",
    "Campaigns.newCampaign": "Create New Campaign",
    "Campaigns.activeCampaigns": "Active Campaigns",
    "Campaigns.totalDistributed": "Total Distributed",
    "Campaigns.pastPassive": "Past / Passive",
    "Campaigns.tabs.active": "Active Campaigns",
    "Campaigns.tabs.passive": "Past / Passive",
    "Campaigns.pastCampaigns.title": "Past Campaigns",
    "Campaigns.pastCampaigns.description": "Expired or terminated campaigns.",
    "Campaigns.table.name": "Campaign Name",
    "Campaigns.table.project": "Project",
    "Campaigns.table.typeTarget": "Type / Target",
    "Campaigns.table.bonusValue": "Bonus Value",
    "Campaigns.table.dateRange": "Date Range",
    "Campaigns.table.status": "Status",
    "Campaigns.table.actions": "Actions",
    "Campaigns.table.allProjects": "All Projects",
    "Campaigns.table.empty": "No campaigns found in this list.",
    "Campaigns.types.Visits": "Visit",
    "Campaigns.types.Volume": "Volume",
    "Campaigns.types.Unit Sales": "Unit Sales",
    "Campaigns.types.Special": "Special Bonus",
    "Campaigns.labels.target": "Target",
    "Campaigns.form.title": "New Incentive Campaign",
    "Campaigns.form.description": "Start a new reward or bonus program to motivate brokers.",
    "Campaigns.form.basicInfo": "Basic Information",
    "Campaigns.form.name": "Campaign Name *",
    "Campaigns.form.namePlaceholder": "Ex: Spring Launch Special Bonus",
    "Campaigns.form.terms": "Description / Terms",
    "Campaigns.form.termsPlaceholder": "Enter campaign details and participation terms...",
    "Campaigns.form.project": "Valid Project",
    "Campaigns.form.type": "Campaign Type",
    "Campaigns.form.select": "Select",
    "Campaigns.form.targetReward": "Target and Reward",
    "Campaigns.form.bonusAmount": "Bonus Amount *",
    "Campaigns.form.targetCount": "Target Count (Optional)",
    "Campaigns.form.targetCountPlaceholder": "Ex: 3 sales",
    "Campaigns.form.startDate": "Start Date",
    "Campaigns.form.endDate": "End Date",
    "Campaigns.form.cancel": "Cancel",
    "Campaigns.form.submit": "Publish Campaign",
    "Campaigns.form.errors.required": "Please fill in the required fields.",
    "Campaigns.form.success": "Campaign created successfully.",
    "Campaigns.form.editTitle": "Edit Campaign",
    "Campaigns.form.editDesc": "Update the details of the {name} campaign.",
    "Campaigns.form.update": "Update",
    "Campaigns.form.updateSuccess": "Campaign updated.",
    "Campaigns.status.active": "Active",
    "Campaigns.status.passive": "Passive",
    "Campaigns.actions.confirmEnd": "Are you sure you want to end this campaign?",
    "Campaigns.actions.successEnd": "Campaign ended.",
    "Campaigns.actions.menuTitle": "Actions",
    "Campaigns.actions.edit": "Edit",
    "Campaigns.actions.end": "End Campaign",

    // Inventory types from TR
    "Inventory.status.Stock": "Stock",

    // Broker.apply.success from TR
    "Broker.apply.success.codeSent": "Verification code sent to your email.",
    "Broker.apply.success.success": "Your application has been successfully submitted.",
};

let count = 0;
for (const [key, value] of Object.entries(translations)) {
    setNestedValue(en, key, value);
    count++;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 4) + '\n', 'utf-8');
console.log(`✅ Updated ${count} English translations in en.json`);

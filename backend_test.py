#!/usr/bin/env python3
"""
SoloCRM Backend API Testing Script
Tests lead search/filtering and reminders CRUD/notifications functionality
"""

import requests
import json
import time
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://solocrm.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class SoloCRMTester:
    def __init__(self):
        self.test_data = {
            'leads': [],
            'reminders': [],
            'payments': []
        }
        self.test_results = {
            'lead_search_filtering': {'passed': 0, 'failed': 0, 'errors': []},
            'reminders_crud_notifications': {'passed': 0, 'failed': 0, 'errors': []}
        }

    def log_result(self, test_category, test_name, success, message=""):
        """Log test result"""
        if success:
            self.test_results[test_category]['passed'] += 1
            print(f"✅ {test_name}: PASSED {message}")
        else:
            self.test_results[test_category]['failed'] += 1
            self.test_results[test_category]['errors'].append(f"{test_name}: {message}")
            print(f"❌ {test_name}: FAILED {message}")

    def setup_test_data(self):
        """Create test data for comprehensive testing"""
        print("\n🔧 Setting up test data...")
        
        # Create test leads with different statuses and data
        test_leads = [
            {
                "name": "Alice Johnson",
                "email": "alice.johnson@example.com",
                "phone": "+1234567890",
                "message": "Interested in web development services",
                "budget": "5000-10000",
                "serviceType": "Web Development"
            },
            {
                "name": "Bob Smith",
                "email": "bob.smith@example.com", 
                "phone": "+1234567891",
                "message": "Need mobile app development",
                "budget": "10000-20000",
                "serviceType": "Mobile Development"
            },
            {
                "name": "Carol Davis",
                "email": "carol.davis@example.com",
                "phone": "+1234567892", 
                "message": "Looking for consulting services",
                "budget": "2000-5000",
                "serviceType": "Consulting"
            },
            {
                "name": "David Wilson",
                "email": "david.wilson@example.com",
                "phone": "+1234567893",
                "message": "E-commerce website needed",
                "budget": "15000-25000", 
                "serviceType": "E-commerce"
            }
        ]

        # Create leads
        for lead_data in test_leads:
            try:
                response = requests.post(f"{BASE_URL}/leads", json=lead_data, headers=HEADERS)
                if response.status_code == 201:
                    lead = response.json()
                    self.test_data['leads'].append(lead)
                    print(f"Created lead: {lead['name']} (ID: {lead['id']})")
                else:
                    print(f"Failed to create lead {lead_data['name']}: {response.text}")
            except Exception as e:
                print(f"Error creating lead {lead_data['name']}: {str(e)}")

        # Update lead statuses to create variety
        if len(self.test_data['leads']) >= 4:
            statuses = ['New', 'Contacted', 'Qualified', 'Done']
            for i, status in enumerate(statuses):
                if i < len(self.test_data['leads']):
                    lead_id = self.test_data['leads'][i]['id']
                    try:
                        response = requests.patch(f"{BASE_URL}/leads/{lead_id}", 
                                                json={"status": status}, headers=HEADERS)
                        if response.status_code == 200:
                            self.test_data['leads'][i]['status'] = status
                            print(f"Updated lead {lead_id} status to {status}")
                    except Exception as e:
                        print(f"Error updating lead status: {str(e)}")

        print(f"✅ Created {len(self.test_data['leads'])} test leads")

    def test_lead_search_filtering(self):
        """Test lead search and filtering functionality"""
        print("\n🔍 Testing Lead Search and Filtering...")
        
        # Test 1: Basic search by name
        try:
            response = requests.get(f"{BASE_URL}/leads?search=Alice", headers=HEADERS)
            if response.status_code == 200:
                results = response.json()
                alice_found = any(lead['name'] == 'Alice Johnson' for lead in results)
                self.log_result('lead_search_filtering', 'Search by name', 
                              alice_found, f"Found {len(results)} results")
            else:
                self.log_result('lead_search_filtering', 'Search by name', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('lead_search_filtering', 'Search by name', False, str(e))

        # Test 2: Search by email
        try:
            response = requests.get(f"{BASE_URL}/leads?search=bob.smith", headers=HEADERS)
            if response.status_code == 200:
                results = response.json()
                bob_found = any('bob.smith' in lead['email'].lower() for lead in results)
                self.log_result('lead_search_filtering', 'Search by email', 
                              bob_found, f"Found {len(results)} results")
            else:
                self.log_result('lead_search_filtering', 'Search by email', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('lead_search_filtering', 'Search by email', False, str(e))

        # Test 3: Case insensitive search
        try:
            response = requests.get(f"{BASE_URL}/leads?search=CAROL", headers=HEADERS)
            if response.status_code == 200:
                results = response.json()
                carol_found = any('carol' in lead['name'].lower() for lead in results)
                self.log_result('lead_search_filtering', 'Case insensitive search', 
                              carol_found, f"Found {len(results)} results")
            else:
                self.log_result('lead_search_filtering', 'Case insensitive search', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('lead_search_filtering', 'Case insensitive search', False, str(e))

        # Test 4: Filter by status - New
        try:
            response = requests.get(f"{BASE_URL}/leads?status=New", headers=HEADERS)
            if response.status_code == 200:
                results = response.json()
                all_new = all(lead['status'] == 'New' for lead in results)
                self.log_result('lead_search_filtering', 'Filter by status New', 
                              all_new, f"Found {len(results)} New leads")
            else:
                self.log_result('lead_search_filtering', 'Filter by status New', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('lead_search_filtering', 'Filter by status New', False, str(e))

        # Test 5: Filter by status - Contacted
        try:
            response = requests.get(f"{BASE_URL}/leads?status=Contacted", headers=HEADERS)
            if response.status_code == 200:
                results = response.json()
                all_contacted = all(lead['status'] == 'Contacted' for lead in results)
                self.log_result('lead_search_filtering', 'Filter by status Contacted', 
                              all_contacted, f"Found {len(results)} Contacted leads")
            else:
                self.log_result('lead_search_filtering', 'Filter by status Contacted', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('lead_search_filtering', 'Filter by status Contacted', False, str(e))

        # Test 6: Combined search and filter
        try:
            response = requests.get(f"{BASE_URL}/leads?search=Johnson&status=New", headers=HEADERS)
            if response.status_code == 200:
                results = response.json()
                valid_results = all(
                    ('johnson' in lead['name'].lower() or 'johnson' in lead['email'].lower()) 
                    and lead['status'] == 'New' 
                    for lead in results
                )
                self.log_result('lead_search_filtering', 'Combined search and filter', 
                              valid_results, f"Found {len(results)} results")
            else:
                self.log_result('lead_search_filtering', 'Combined search and filter', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('lead_search_filtering', 'Combined search and filter', False, str(e))

        # Test 7: Empty search (should return all)
        try:
            response = requests.get(f"{BASE_URL}/leads", headers=HEADERS)
            if response.status_code == 200:
                all_leads = response.json()
                response2 = requests.get(f"{BASE_URL}/leads?search=", headers=HEADERS)
                if response2.status_code == 200:
                    empty_search_leads = response2.json()
                    same_count = len(all_leads) == len(empty_search_leads)
                    self.log_result('lead_search_filtering', 'Empty search returns all', 
                                  same_count, f"All: {len(all_leads)}, Empty search: {len(empty_search_leads)}")
                else:
                    self.log_result('lead_search_filtering', 'Empty search returns all', 
                                  False, f"HTTP {response2.status_code}: {response2.text}")
            else:
                self.log_result('lead_search_filtering', 'Empty search returns all', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('lead_search_filtering', 'Empty search returns all', False, str(e))

        # Test 8: Invalid status filter
        try:
            response = requests.get(f"{BASE_URL}/leads?status=InvalidStatus", headers=HEADERS)
            if response.status_code == 200:
                results = response.json()
                # Should return empty array for invalid status
                self.log_result('lead_search_filtering', 'Invalid status filter', 
                              len(results) == 0, f"Found {len(results)} results for invalid status")
            else:
                self.log_result('lead_search_filtering', 'Invalid status filter', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('lead_search_filtering', 'Invalid status filter', False, str(e))

    def test_reminders_crud_notifications(self):
        """Test reminders CRUD operations and notifications"""
        print("\n⏰ Testing Reminders CRUD and Notifications...")
        
        if not self.test_data['leads']:
            self.log_result('reminders_crud_notifications', 'Setup check', 
                          False, "No test leads available")
            return

        lead_id = self.test_data['leads'][0]['id']
        
        # Test 1: Create reminder - follow-up type
        reminder_data = {
            "leadId": lead_id,
            "title": "Follow up with Alice",
            "description": "Check if she needs more information",
            "dueDate": (datetime.now() + timedelta(days=1)).isoformat(),
            "type": "follow-up"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/reminders", json=reminder_data, headers=HEADERS)
            if response.status_code == 201:
                reminder = response.json()
                self.test_data['reminders'].append(reminder)
                self.log_result('reminders_crud_notifications', 'Create follow-up reminder', 
                              True, f"Created reminder ID: {reminder['id']}")
            else:
                self.log_result('reminders_crud_notifications', 'Create follow-up reminder', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('reminders_crud_notifications', 'Create follow-up reminder', False, str(e))

        # Test 2: Create reminder - payment-due type
        payment_reminder_data = {
            "leadId": lead_id,
            "title": "Payment due reminder",
            "description": "Invoice #001 payment is due",
            "dueDate": (datetime.now() + timedelta(days=3)).isoformat(),
            "type": "payment-due"
        }
        
        try:
            response = requests.post(f"{BASE_URL}/reminders", json=payment_reminder_data, headers=HEADERS)
            if response.status_code == 201:
                reminder = response.json()
                self.test_data['reminders'].append(reminder)
                self.log_result('reminders_crud_notifications', 'Create payment-due reminder', 
                              True, f"Created reminder ID: {reminder['id']}")
            else:
                self.log_result('reminders_crud_notifications', 'Create payment-due reminder', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('reminders_crud_notifications', 'Create payment-due reminder', False, str(e))

        # Test 3: Create reminder with missing required fields
        try:
            invalid_data = {"leadId": lead_id, "title": ""}  # Missing dueDate and empty title
            response = requests.post(f"{BASE_URL}/reminders", json=invalid_data, headers=HEADERS)
            self.log_result('reminders_crud_notifications', 'Create reminder validation', 
                          response.status_code == 400, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result('reminders_crud_notifications', 'Create reminder validation', False, str(e))

        # Test 4: Get all reminders
        try:
            response = requests.get(f"{BASE_URL}/reminders", headers=HEADERS)
            if response.status_code == 200:
                reminders = response.json()
                self.log_result('reminders_crud_notifications', 'Get all reminders', 
                              len(reminders) >= len(self.test_data['reminders']), 
                              f"Found {len(reminders)} reminders")
            else:
                self.log_result('reminders_crud_notifications', 'Get all reminders', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('reminders_crud_notifications', 'Get all reminders', False, str(e))

        # Test 5: Filter reminders by leadId
        try:
            response = requests.get(f"{BASE_URL}/reminders?leadId={lead_id}", headers=HEADERS)
            if response.status_code == 200:
                reminders = response.json()
                all_match_lead = all(r['leadId'] == lead_id for r in reminders)
                self.log_result('reminders_crud_notifications', 'Filter reminders by leadId', 
                              all_match_lead, f"Found {len(reminders)} reminders for lead")
            else:
                self.log_result('reminders_crud_notifications', 'Filter reminders by leadId', 
                              False, f"HTTP {response.status_code}: {response.text}")
        except Exception as e:
            self.log_result('reminders_crud_notifications', 'Filter reminders by leadId', False, str(e))

        # Test 6: Update reminder (mark as completed)
        if self.test_data['reminders']:
            reminder_id = self.test_data['reminders'][0]['id']
            try:
                update_data = {"completed": True}
                response = requests.patch(f"{BASE_URL}/reminders/{reminder_id}", 
                                        json=update_data, headers=HEADERS)
                if response.status_code == 200:
                    updated_reminder = response.json()
                    self.log_result('reminders_crud_notifications', 'Update reminder completed', 
                                  updated_reminder['completed'] == True, 
                                  f"Reminder marked as completed")
                else:
                    self.log_result('reminders_crud_notifications', 'Update reminder completed', 
                                  False, f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('reminders_crud_notifications', 'Update reminder completed', False, str(e))

        # Test 7: Send reminder notification - email (should gracefully fail without API keys)
        if self.test_data['reminders']:
            reminder_id = self.test_data['reminders'][0]['id']
            try:
                send_data = {"channel": "email"}
                response = requests.post(f"{BASE_URL}/reminders/{reminder_id}/send", 
                                       json=send_data, headers=HEADERS)
                if response.status_code == 200:
                    result = response.json()
                    # Should return graceful failure message
                    email_not_configured = (
                        'results' in result and 
                        'email' in result['results'] and 
                        not result['results']['email']['success']
                    )
                    self.log_result('reminders_crud_notifications', 'Send email notification graceful fallback', 
                                  email_not_configured, 
                                  f"Email result: {result.get('results', {}).get('email', {})}")
                else:
                    self.log_result('reminders_crud_notifications', 'Send email notification graceful fallback', 
                                  False, f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('reminders_crud_notifications', 'Send email notification graceful fallback', False, str(e))

        # Test 8: Send reminder notification - WhatsApp (should gracefully fail without API keys)
        if self.test_data['reminders']:
            reminder_id = self.test_data['reminders'][0]['id']
            try:
                send_data = {"channel": "whatsapp"}
                response = requests.post(f"{BASE_URL}/reminders/{reminder_id}/send", 
                                       json=send_data, headers=HEADERS)
                if response.status_code == 200:
                    result = response.json()
                    # Should return graceful failure message
                    whatsapp_not_configured = (
                        'results' in result and 
                        'whatsapp' in result['results'] and 
                        not result['results']['whatsapp']['success']
                    )
                    self.log_result('reminders_crud_notifications', 'Send WhatsApp notification graceful fallback', 
                                  whatsapp_not_configured, 
                                  f"WhatsApp result: {result.get('results', {}).get('whatsapp', {})}")
                else:
                    self.log_result('reminders_crud_notifications', 'Send WhatsApp notification graceful fallback', 
                                  False, f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('reminders_crud_notifications', 'Send WhatsApp notification graceful fallback', False, str(e))

        # Test 9: Send reminder notification - both channels
        if self.test_data['reminders']:
            reminder_id = self.test_data['reminders'][0]['id']
            try:
                send_data = {"channel": "both"}
                response = requests.post(f"{BASE_URL}/reminders/{reminder_id}/send", 
                                       json=send_data, headers=HEADERS)
                if response.status_code == 200:
                    result = response.json()
                    # Should have both email and whatsapp results
                    has_both_results = (
                        'results' in result and 
                        'email' in result['results'] and 
                        'whatsapp' in result['results']
                    )
                    self.log_result('reminders_crud_notifications', 'Send both channels notification', 
                                  has_both_results, 
                                  f"Both channels attempted")
                else:
                    self.log_result('reminders_crud_notifications', 'Send both channels notification', 
                                  False, f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('reminders_crud_notifications', 'Send both channels notification', False, str(e))

        # Test 10: Send notification for non-existent reminder
        try:
            fake_id = str(uuid.uuid4())
            send_data = {"channel": "email"}
            response = requests.post(f"{BASE_URL}/reminders/{fake_id}/send", 
                                   json=send_data, headers=HEADERS)
            self.log_result('reminders_crud_notifications', 'Send notification non-existent reminder', 
                          response.status_code == 404, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_result('reminders_crud_notifications', 'Send notification non-existent reminder', False, str(e))

        # Test 11: Delete reminder
        if len(self.test_data['reminders']) > 1:
            reminder_id = self.test_data['reminders'][1]['id']
            try:
                response = requests.delete(f"{BASE_URL}/reminders/{reminder_id}", headers=HEADERS)
                if response.status_code == 200:
                    # Verify deletion
                    verify_response = requests.get(f"{BASE_URL}/reminders", headers=HEADERS)
                    if verify_response.status_code == 200:
                        remaining_reminders = verify_response.json()
                        deleted = not any(r['id'] == reminder_id for r in remaining_reminders)
                        self.log_result('reminders_crud_notifications', 'Delete reminder', 
                                      deleted, f"Reminder deleted successfully")
                    else:
                        self.log_result('reminders_crud_notifications', 'Delete reminder', 
                                      False, "Could not verify deletion")
                else:
                    self.log_result('reminders_crud_notifications', 'Delete reminder', 
                                  False, f"HTTP {response.status_code}: {response.text}")
            except Exception as e:
                self.log_result('reminders_crud_notifications', 'Delete reminder', False, str(e))

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test reminders
        for reminder in self.test_data['reminders']:
            try:
                response = requests.delete(f"{BASE_URL}/reminders/{reminder['id']}", headers=HEADERS)
                if response.status_code == 200:
                    print(f"Deleted reminder: {reminder['id']}")
            except Exception as e:
                print(f"Error deleting reminder {reminder['id']}: {str(e)}")

        # Delete test leads
        for lead in self.test_data['leads']:
            try:
                response = requests.delete(f"{BASE_URL}/leads/{lead['id']}", headers=HEADERS)
                if response.status_code == 200:
                    print(f"Deleted lead: {lead['name']} ({lead['id']})")
            except Exception as e:
                print(f"Error deleting lead {lead['id']}: {str(e)}")

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🏁 TEST SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for category, results in self.test_results.items():
            passed = results['passed']
            failed = results['failed']
            total_passed += passed
            total_failed += failed
            
            print(f"\n📊 {category.replace('_', ' ').title()}:")
            print(f"   ✅ Passed: {passed}")
            print(f"   ❌ Failed: {failed}")
            
            if results['errors']:
                print(f"   🔍 Errors:")
                for error in results['errors']:
                    print(f"      - {error}")
        
        print(f"\n🎯 OVERALL RESULTS:")
        print(f"   ✅ Total Passed: {total_passed}")
        print(f"   ❌ Total Failed: {total_failed}")
        print(f"   📈 Success Rate: {(total_passed/(total_passed+total_failed)*100):.1f}%" if (total_passed+total_failed) > 0 else "N/A")
        
        if total_failed == 0:
            print(f"\n🎉 ALL TESTS PASSED! Backend is working correctly.")
        else:
            print(f"\n⚠️  Some tests failed. Please review the errors above.")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting SoloCRM Backend API Tests")
        print(f"🌐 Testing against: {BASE_URL}")
        
        # Test API connectivity first
        try:
            response = requests.get(f"{BASE_URL}/", headers=HEADERS)
            if response.status_code == 200:
                print("✅ API connectivity confirmed")
            else:
                print(f"⚠️  API returned status {response.status_code}")
        except Exception as e:
            print(f"❌ API connectivity failed: {str(e)}")
            return
        
        self.setup_test_data()
        self.test_lead_search_filtering()
        self.test_reminders_crud_notifications()
        self.cleanup_test_data()
        self.print_summary()

if __name__ == "__main__":
    tester = SoloCRMTester()
    tester.run_all_tests()
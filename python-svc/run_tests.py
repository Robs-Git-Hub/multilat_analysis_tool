
#!/usr/bin/env python3
"""
Test runner script for the Multilat Analysis API.
Run this script to execute all tests and generate a coverage report.
"""

import subprocess
import sys
import os

def run_tests():
    """Run all tests and display results."""
    print("🧪 Running Multilat Analysis API Tests")
    print("=" * 50)
    
    # Change to the python-svc directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        # Run pytest with verbose output on all test files
        result = subprocess.run([
            sys.executable, "-m", "pytest", 
            "test_main.py",
            "test_models.py",
            "test_database.py",
            "-v", 
            "--tb=short",
            "--color=yes",
            "-s"  # Don't capture output so we can see print statements
        ], capture_output=False, text=True)
        
        if result.returncode == 0:
            print("\n✅ All tests passed!")
        else:
            print("\n❌ Some tests failed!")
            
        return result.returncode
        
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return 1

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)

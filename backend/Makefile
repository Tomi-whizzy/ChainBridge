.PHONY: lint
lint:
	@echo "Running black (format check)..."
	black --check .
	@echo ""
	@echo "Running flake8 (lint)..."
	flake8 . --count --max-complexity=10 --max-line-length=127 --statistics
	@echo ""
	@echo "Running mypy (type check)..."
	mypy . --ignore-missing-imports
	@echo ""
	@echo "All lint checks passed."

# Hand-built test data, not real ACE text

The CSV files in this folder were written by hand for `tests/cr_exact_match_pass_test.py`, which tests
`kb/_cr_exact_match_pass.py`. They use made-up exhibit identifiers that start with `TEST-`. The wording is
invented to cover each label the pass gives. It is not ACE National Guide or Military Guide text, and it is not a
copy of a live MAP extract.

COBIx built them (issue #3480, Sources 32 to 34). The one change from those files: the `origin` value is quoted,
so each row has the columns its header names.

============================================================
SAMPLE DROP OPTIMIZATION
============================================================

TARGET MEDICINE
------------------------------------------------------------
Generic Name: Atorvastatin
Brand Name: Newstat
Therapeutic Class: Lipid Lowering
Dosage Form: Tablet
Strength: 10 mg
Total Samples: 10000
Medicine Price: 120.0

MEDICINE IDENTIFICATION
------------------------------------------------------------
Medicine Exists: NO
Matched Medicine ID: None
Operating Mode: New Medicine / Find Historical Analog

SEGMENTATION
------------------------------------------------------------
Candidate Count: 4
Tier 1: 0
Tier 2: 0
Tier 3: 4

TOP SIMILAR MEDICINES
------------------------------------------------------------
Rank | ID       | Generic             | Brand             | Similarity
1    | MED014   | Rosuvastatin        | Rosuvas 10        | 0.5591
2    | MED046   | Ezetimibe           | Ezedoc 10         | 0.5306
3    | MED047   | Fenofibrate         | Fenolip 145       | 0.5071
4    | MED002   | Atorvastatin        | Atorva 10         | 0.4198

SELECTED HISTORICAL ANALOG
------------------------------------------------------------
Medicine ID: MED014
Generic: Rosuvastatin
Brand: Rosuvas 10
Similarity: 0.5591
Historical Events: 5066
Active HCPs: 4154
Historical Months: 36

MODEL COMPARISON
------------------------------------------------------------
Model      MAE        RMSE       MAPE       R2        
XGBoost    1.2538     1.5985     74.5719    -0.5335   
CatBoost   1.1576     1.3812     70.1806    -0.1449   

SELECTED MODEL: 
CatBoost

SELECTION REASON: 
Lowest MAE

HCP DEMAND PREDICTION
------------------------------------------------------------
Eligible HCPs: 797
Selected HCPs: 100
Total Predicted Demand: 294.36

SAMPLE DISTRIBUTION
------------------------------------------------------------
Total Samples: 10000
Allocated Samples: 10000
Allocation Difference: 0

HCP-wise table:

Rank | HCP        | Specialty       | Locality        | Zone        | Predicted Demand | Potential Score | Samples
1    | NPIIN1000000186 | Psychiatry      | Sholinganallur  | South Chenn | 5.14             | 100.0           | 174
2    | NPIIN1000002518 | Orthopedics     | Porur           | Unknown     | 5.14             | 100.0           | 174
3    | NPIIN1000004633 | Urology         | Adyar           | South Chenn | 5.14             | 100.0           | 174
4    | NPIIN1000001011 | Cardiology      | Egmore          | Central Che | 4.77             | 92.9            | 162
5    | NPIIN1000003167 | Orthopedics     | Egmore          | Central Che | 4.77             | 92.9            | 162
6    | NPIIN1000003525 | Pediatrics      | Mylapore        | Central Che | 4.69             | 91.3            | 159
7    | NPIIN1000006811 | Neurology       | Adyar           | South Chenn | 4.25             | 82.7            | 144
8    | NPIIN1000006429 | Orthopedics     | Pallavaram      | South Chenn | 4.05             | 78.8            | 138
9    | NPIIN1000001970 | Neurology       | Pallavaram      | South Chenn | 4.04             | 78.6            | 137
10   | NPIIN1000001198 | Neurology       | Velachery       | South Chenn | 3.92             | 76.2            | 133
11   | NPIIN1000011397 | Endocrinology   | Mogappair       | North Chenn | 3.92             | 76.2            | 133
12   | NPIIN1000004948 | Psychiatry      | Porur           | Unknown     | 3.84             | 74.7            | 130
13   | NPIIN1000003206 | Pulmonology     | Guindy          | Central Che | 3.71             | 72.3            | 126
14   | NPIIN1000004030 | ENT             | Velachery       | South Chenn | 3.55             | 69.2            | 121
15   | NPIIN1000010820 | Endocrinology   | Anna Nagar      | North Chenn | 3.43             | 66.7            | 116
16   | NPIIN1000006062 | Psychiatry      | Guindy          | Central Che | 3.30             | 64.3            | 112
17   | NPIIN1000003346 | General Medicin | T Nagar         | Central Che | 3.01             | 58.6            | 102
18   | NPIIN1000005044 | Pediatrics      | Velachery       | South Chenn | 3.01             | 58.6            | 102
19   | NPIIN1000001934 | Cardiology      | Anna Nagar      | North Chenn | 3.01             | 58.6            | 102
20   | NPIIN1000006223 | Pulmonology     | Anna Nagar      | North Chenn | 3.01             | 58.6            | 102
21   | NPIIN1000005764 | Urology         | Velachery       | South Chenn | 3.01             | 58.6            | 102
22   | NPIIN1000000848 | Endocrinology   | Ambattur        | North Chenn | 3.01             | 58.6            | 102
23   | NPIIN1000005808 | ENT             | Tambaram        | South Chenn | 2.83             | 55.0            | 96
24   | NPIIN1000003075 | Endocrinology   | Tambaram        | South Chenn | 2.83             | 55.0            | 96
25   | NPIIN1000003684 | Pulmonology     | Mogappair       | North Chenn | 2.83             | 55.0            | 96
26   | NPIIN1000007548 | Endocrinology   | Porur           | Unknown     | 2.83             | 55.0            | 96
27   | NPIIN1000008144 | Psychiatry      | Pallavaram      | South Chenn | 2.83             | 55.0            | 96
28   | NPIIN1000009104 | ENT             | Egmore          | Central Che | 2.83             | 55.0            | 96
29   | NPIIN1000003241 | ENT             | Sholinganallur  | South Chenn | 2.83             | 55.0            | 96
30   | NPIIN1000000956 | ENT             | Velachery       | South Chenn | 2.83             | 55.0            | 96
31   | NPIIN1000007649 | Orthopedics     | Perambur        | North Chenn | 2.83             | 55.0            | 96
32   | NPIIN1000010411 | Pediatrics      | Alandur         | South Chenn | 2.83             | 55.0            | 96
33   | NPIIN1000006275 | Psychiatry      | Porur           | Unknown     | 2.83             | 55.0            | 96
34   | NPIIN1000005060 | Diabetology     | T Nagar         | Central Che | 2.81             | 54.8            | 96
35   | NPIIN1000004490 | Pediatrics      | Porur           | Unknown     | 2.79             | 54.2            | 95
36   | NPIIN1000004445 | Dermatology     | Kodambakkam     | Central Che | 2.77             | 53.9            | 94
37   | NPIIN1000004953 | General Medicin | Kodambakkam     | Central Che | 2.77             | 53.9            | 94
38   | NPIIN1000001308 | Cardiology      | Ambattur        | North Chenn | 2.77             | 53.9            | 94
39   | NPIIN1000005160 | Diabetology     | Ambattur        | North Chenn | 2.77             | 53.9            | 94
40   | NPIIN1000010934 | Neurology       | Velachery       | South Chenn | 2.77             | 53.9            | 94
41   | NPIIN1000008878 | ENT             | Nungambakkam    | Central Che | 2.77             | 53.9            | 94
42   | NPIIN1000009133 | Orthopedics     | Alandur         | South Chenn | 2.77             | 53.9            | 94
43   | NPIIN1000009066 | Pulmonology     | Kodambakkam     | Central Che | 2.77             | 53.9            | 94
44   | NPIIN1000002861 | General Medicin | Mogappair       | North Chenn | 2.77             | 53.9            | 94
45   | NPIIN1000001291 | Psychiatry      | Chromepet       | South Chenn | 2.70             | 52.6            | 92
46   | NPIIN1000005805 | ENT             | Kodambakkam     | Central Che | 2.70             | 52.6            | 92
47   | NPIIN1000005026 | General Medicin | Mylapore        | Central Che | 2.68             | 52.1            | 91
48   | NPIIN1000005420 | Pulmonology     | Velachery       | South Chenn | 2.65             | 51.6            | 90
49   | NPIIN1000009894 | Pulmonology     | Kodambakkam     | Central Che | 2.64             | 51.3            | 90
50   | NPIIN1000005955 | General Medicin | Guindy          | Central Che | 2.64             | 51.3            | 89
51   | NPIIN1000003357 | Diabetology     | Velachery       | South Chenn | 2.64             | 51.3            | 90
52   | NPIIN1000001849 | General Medicin | Mylapore        | Central Che | 2.64             | 51.3            | 90
53   | NPIIN1000009831 | Diabetology     | Guindy          | Central Che | 2.64             | 51.3            | 90
54   | NPIIN1000002780 | Diabetology     | Pallavaram      | South Chenn | 2.64             | 51.3            | 90
55   | NPIIN1000003304 | Neurology       | Mogappair       | North Chenn | 2.64             | 51.3            | 90
56   | NPIIN1000006482 | Endocrinology   | T Nagar         | Central Che | 2.64             | 51.3            | 90
57   | NPIIN1000005880 | Urology         | Velachery       | South Chenn | 2.64             | 51.3            | 90
58   | NPIIN1000011377 | Diabetology     | Royapettah      | Central Che | 2.64             | 51.3            | 90
59   | NPIIN1000009654 | Pediatrics      | Porur           | Unknown     | 2.64             | 51.3            | 90
60   | NPIIN1000005972 | Diabetology     | Alandur         | South Chenn | 2.64             | 51.3            | 90
61   | NPIIN1000007157 | Cardiology      | Ambattur        | North Chenn | 2.64             | 51.3            | 90
62   | NPIIN1000000826 | Psychiatry      | Mogappair       | North Chenn | 2.64             | 51.3            | 89
63   | NPIIN1000011565 | ENT             | Chromepet       | South Chenn | 2.64             | 51.3            | 89
64   | NPIIN1000000275 | Diabetology     | Velachery       | South Chenn | 2.64             | 51.3            | 90
65   | NPIIN1000001602 | General Medicin | Perambur        | North Chenn | 2.64             | 51.3            | 89
66   | NPIIN1000004562 | Urology         | Royapettah      | Central Che | 2.64             | 51.3            | 90
67   | NPIIN1000004607 | Urology         | Adyar           | South Chenn | 2.64             | 51.3            | 90
68   | NPIIN1000002355 | ENT             | Egmore          | Central Che | 2.64             | 51.3            | 90
69   | NPIIN1000010625 | Urology         | Ambattur        | North Chenn | 2.64             | 51.3            | 90
70   | NPIIN1000002606 | Urology         | T Nagar         | Central Che | 2.64             | 51.3            | 90
71   | NPIIN1000009638 | Orthopedics     | Chromepet       | South Chenn | 2.64             | 51.3            | 90
72   | NPIIN1000002288 | Endocrinology   | Anna Nagar      | North Chenn | 2.64             | 51.3            | 90
73   | NPIIN1000003183 | ENT             | Chromepet       | South Chenn | 2.64             | 51.3            | 90
74   | NPIIN1000002833 | Pediatrics      | Mogappair       | North Chenn | 2.64             | 51.3            | 90
75   | NPIIN1000008980 | Dermatology     | Adyar           | South Chenn | 2.63             | 51.2            | 89
76   | NPIIN1000007970 | General Medicin | Mogappair       | North Chenn | 2.62             | 51.1            | 89
77   | NPIIN1000004442 | Pulmonology     | T Nagar         | Central Che | 2.62             | 51.0            | 89
78   | NPIIN1000002871 | Dermatology     | Adyar           | South Chenn | 2.62             | 51.0            | 89
79   | NPIIN1000008221 | Pediatrics      | Adyar           | South Chenn | 2.62             | 51.0            | 89
80   | NPIIN1000006069 | General Medicin | Chromepet       | South Chenn | 2.62             | 51.0            | 89
81   | NPIIN1000007579 | Cardiology      | Adyar           | South Chenn | 2.62             | 51.0            | 89
82   | NPIIN1000000510 | Psychiatry      | Nungambakkam    | Central Che | 2.62             | 51.0            | 89
83   | NPIIN1000008135 | Diabetology     | Guindy          | Central Che | 2.62             | 51.0            | 89
84   | NPIIN1000010598 | Pulmonology     | Royapettah      | Central Che | 2.62             | 51.0            | 89
85   | NPIIN1000006518 | Pulmonology     | Egmore          | Central Che | 2.62             | 51.0            | 89
86   | NPIIN1000008951 | Diabetology     | Velachery       | South Chenn | 2.62             | 51.0            | 89
87   | NPIIN1000011479 | ENT             | Nungambakkam    | Central Che | 2.62             | 51.0            | 89
88   | NPIIN1000008319 | Diabetology     | T Nagar         | Central Che | 2.62             | 51.0            | 89
89   | NPIIN1000006366 | Psychiatry      | Guindy          | Central Che | 2.62             | 51.0            | 89
90   | NPIIN1000011099 | Diabetology     | Porur           | Unknown     | 2.62             | 51.0            | 89
91   | NPIIN1000003101 | Urology         | Royapettah      | Central Che | 2.62             | 51.0            | 89
92   | NPIIN1000000499 | Psychiatry      | Egmore          | Central Che | 2.62             | 51.0            | 89
93   | NPIIN1000001219 | Pediatrics      | Sholinganallur  | South Chenn | 2.62             | 51.0            | 89
94   | NPIIN1000008866 | Endocrinology   | Adyar           | South Chenn | 2.60             | 50.6            | 88
95   | NPIIN1000008682 | Urology         | Chromepet       | South Chenn | 2.60             | 50.6            | 88
96   | NPIIN1000004122 | Psychiatry      | Guindy          | Central Che | 2.56             | 49.8            | 87
97   | NPIIN1000011179 | General Medicin | Sholinganallur  | South Chenn | 2.55             | 49.7            | 87
98   | NPIIN1000002887 | Urology         | Pallavaram      | South Chenn | 2.55             | 49.6            | 86
99   | NPIIN1000001180 | Neurology       | Tambaram        | South Chenn | 2.55             | 49.6            | 86
100  | NPIIN1000005434 | Neurology       | T Nagar         | Central Che | 2.55             | 49.6            | 86

ZONE DISTRIBUTION
------------------------------------------------------------
Zone            | HCP Count | Predicted Demand | Samples | Percentage
Central Chennai | 35        | 101.40           | 3446    | 34.46%
North Chennai   | 18        | 51.42            | 1746    | 17.46%
South Chennai   | 40        | 118.88           | 4038    | 40.38%
Unknown         | 7         | 22.67            | 770     | 7.70%

ROI ANALYSIS
------------------------------------------------------------
Sample Investment: 200000.00
Expected Incremental Prescriptions: 29.44
Expected Incremental Units: 58.87
Expected Revenue: 7064.60
Expected Variable Cost: 2649.22
Expected Incremental Profit: 4415.37
Projected ROI: -97.79%

ROI DISCLAIMER:
Projected ROI is based on user-provided commercial assumptions and analog-based demand estimates. It is not a causal or realized promotional ROI.

============================================================

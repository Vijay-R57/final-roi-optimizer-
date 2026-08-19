import streamlit as st, pandas as pd
from src.services.sample_drop_service import SampleDropService
st.set_page_config(page_title='Sample Drop Optimization',layout='wide'); st.title('SAMPLE DROP OPTIMIZATION')
st.warning('Projected ROI uses assumptions and synthetic data; it is not actual realized or causal ROI.')
with st.sidebar:
    total=st.number_input('Total Samples',0,1000000,10000); price=st.number_input('Medicine Price (INR)',0.0,100000.0,120.0); cost=st.number_input('Sample Cost',0.0,100000.0,0.0587,format="%.4f"); lift=st.number_input('Expected Sample Lift %',0.0,100.0,10.0)/100; units=st.number_input('Average Units/Prescription',0.1,100.0,2.0); var=st.number_input('Variable Cost/Unit',0.0,100000.0,45.0); go=st.button('OPTIMIZE SAMPLE DISTRIBUTION')
if go:
    r=SampleDropService().run({'medicine':{'generic_name':'Atorvastatin','brand_name':'NewStat','therapeutic_class':'Lipid Lowering','dosage_form':'Tablet','strength':'10 mg'},'total_samples':total,'medicine_price':price,'sample_cost':cost,'expected_sample_lift':lift,'average_units_per_prescription':units,'variable_cost_per_unit':var}); st.subheader('Selected Similar Medicine'); st.json(r['selected_similar_medicine']); st.subheader('Model Comparison'); st.dataframe(pd.DataFrame(r['model_comparison']).T); st.subheader('HCP Distribution'); st.dataframe(pd.DataFrame(r['prescriber_distribution'])); st.subheader('Zone Distribution'); st.dataframe(pd.DataFrame(r['zone_distribution'])); st.subheader('Projected ROI'); st.json(r['roi'])

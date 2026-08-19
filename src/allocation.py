import numpy as np

def allocate(demand, total, profit_values=None, strategy='demand'):
    d = np.maximum(np.asarray(demand, float), 0)
    
    if strategy == 'roi' and profit_values is not None:
        p = np.maximum(np.asarray(profit_values, float), 0)
        w = p / p.sum() if p.sum() > 0 else np.ones(len(p)) / len(p)
    else:
        w = d / d.sum() if d.sum() > 0 else np.ones(len(d)) / len(d)
        
    raw = w * int(total)
    out = np.floor(raw).astype(int)
    
    remainder = int(total) - out.sum()
    if remainder > 0:
        # Largest remainder method
        frac = raw - out
        out[np.argsort(-frac)[:remainder]] += 1
        
    return out

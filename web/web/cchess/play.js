function cchessplay(comp)
{
    this.comp = comp;
    this.turn = (this.comp.side === "red");

    this.isMyTurn = function()
    {
        return this.turn
    }

    this.toggleTurn = function()
    {
        this.turn = !this.turn
    }

    this.isMyChess = function(cm)
    {
        return (cm.type.charAt(0) === this.comp.side.charAt(0))
    }

    this.isMoveable = function(cm, x, y)
    {
        var step = {oldX:cm.x, oldY:cm.y, newX:x, newY:y}
        var tcm = this.comp.ps[step.newY][step.newX]

        if (cm && tcm && tcm.alive && this.isMyChess(cm) === this.isMyChess(tcm))
        {
            return false;
        }

        var cmname = cm.type.substring(1);
        var ret = false
        if (cmname === "zhu" || cmname === "bing")
        {
            ret = this.isBingMoveable(cm, step)
        }
        else if (cmname === "pao")
        {
            ret = this.isPaoMoveable(cm, tcm, step)
        }
        else if (cmname === "ju")
        {
            ret = this.isJuMoveable(cm, step)
        }
        else if (cmname === "ma")
        {
            ret = this.isMaMoveable(cm, step)
        }
        else if (cmname === "xiang")
        {
            ret = this.isXiangMoveable(cm, step)
        }
        else if (cmname === "shi")
        {
            ret = this.isShiMoveable(cm, step)
        }
        else if (cmname === "jiang" || cmname === "shuai")
        {
            ret = this.isShuaiMoveable(cm, tcm, step)
        }

        /*
        if (ret)
        {
            var jiang = this.comp.cms["bjiang"][0]
            var shuai = this.comp.cms["rshuai"][0]
            ret = (this.countChessmansInRange({oldX:jiang.x, oldY:jiang.y, newX:shuai.x, newY:shuai.y}) !== 0)
        }
        */

        if (ret)
        {
            var t = this.tryStep(cm, x, y)
            if (this.isJiang(this.comp.side))
            {
                ret = false;
            }
            this.rollStep(cm, t);
        }

        return ret
    }

    this.isBingMoveable = function(cm, step)
    {
        var ret = false
        if (step.oldY >= 5)
        {
            ret =  (step.oldX === step.newX && step.newY == step.oldY - 1)
        }
        else
        {
            ret = (step.oldY >= step.newY && Math.pow(step.oldY - step.newY, 2) + Math.pow(step.oldX - step.newX, 2) == 1)
        }
        return ret; 
    }

    this.countX = function(x, s, e)
    {
        var c = 0
        for (var i=s+1; i<e; ++i)
        {
            if (this.comp.ps[i][x])
            {
                ++c
            }
        }
        
        return c
    }


    this.countY = function(y, s ,e)
    {
        var c = 0
        for (var i=s+1; i<e; ++i)
        {
            if (this.comp.ps[y][i])
            {
                ++c
            }
        }
        
        return c
    }

    this.countChessmansInRange = function(step)
    {
        if (step.oldX == step.newX)
        {
            var x = step.oldX
            var s = Math.min(step.oldY, step.newY)
            var e = Math.max(step.oldY, step.newY)

            return this.countX(x, s, e)
        }
        else if (step.oldY == step.newY)
        {
            var y = step.oldY
            var s = Math.min(step.oldX, step.newX)
            var e = Math.max(step.oldX, step.newX)

            return this.countY(y, s, e)
        }
        return false;
    }
    
    this.isPaoMoveable = function(cm, tcm, step)
    {
        var c = (tcm) ? 1 : 0
        var ret = this.countChessmansInRange(step);
        return (ret !== false && ret === c)
    }

    this.isJuMoveable = function(cm, step)
    {
        return (this.countChessmansInRange(step) === 0)
    }

    this.isMaMoveable = function(cm, step)
    {
        var y = step.newY - step.oldY
        var x = step.newX - step.oldX

        if (Math.pow(y, 2) + Math.pow(x, 2) === 5)
        {
            if (Math.abs(x) === 1)
            {
                if (this.comp.ps[y/2 + step.oldY][step.oldX])
                {
                    return false;
                }
            }
            else
            {
                if (this.comp.ps[step.oldY][x/2 + step.oldX])
                {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    this.isXiangMoveable = function(cm, step)
    {
        var y = step.newY - step.oldY
        var x = step.newX - step.oldX

        if (step.newY >= 5 && Math.abs(y) == 2 && Math.abs(x) == 2)
        {
            if (!this.comp.ps[step.oldY + y/2][step.oldX + x/2])
            {
                return true
            }
        }
        return false
    }

    this.isShiMoveable = function(cm, step)
    {
        var y = step.newY - step.oldY
        var x = step.newX - step.oldX

        if (3 <= step.newX && step.newX <=5 &&
            7 <= step.newY && step.newY <=9 &&
            Math.abs(x) == 1 && Math.abs(y) == 1)
        {
            return true
        }

        return false
    }

    this.isShuaiMoveable = function(cm, tcm, step)
    {
        var opponent = "rshuai"
        if (this.comp.side === "red")
        {
            opponent = "bjiang"
        }

        var opshuai = this.comp.cms[opponent][0]
        if (tcm && tcm.type == opponent)
        {
            return (this.countChessmansInRange({oldX:opshuai.x, oldY:opshuai.y, newX:cm.x, newY:cm.y}) === 0)
        }

        var y = step.newY - step.oldY
        var x = step.newX - step.oldX

        if (3 <= step.newX && step.newX <=5 &&
            7 <= step.newY && step.newY <=9 &&
            Math.pow(x, 2) + Math.pow(y, 2) == 1)
        {
            return (this.countChessmansInRange({oldX:opshuai.x, oldY:opshuai.y, newX:step.newX, newY:step.newY}) !== 0)
        }

        return false
    }
    
    this.place = function(cm, x, y)
    {
        var comp = this.comp;
        ret = {oldX:cm.x,oldY:cm.y,newX:x, newY:y}
        comp.ps[cm.y][cm.x] = undefined
        comp.ps[y][x] = cm
        cm.x = x
        cm.y = y
        return ret;
    }

    this.tryStep = function(cm, x, y)
    {
        var comp = this.comp;
        var tcm = comp.ps[y][x];
        this.place(cm, x, y);
        if (!!tcm)
        {
            tcm.alive = false;
            ret.tcm = tcm;
        }
        return ret;
    }


    this.rollStep = function(cm, ret)
    {
        var comp = this.comp;
        this.place(cm, ret.oldX, ret.oldY);
        if (ret.tcm)
        {
            ret.tcm.alive = true;
            comp.ps[ret.newY][ret.newX] = ret.tcm
        }
    }

    this.isJiang = function(side)
    {
        var checkArray;
        var target;
        var comp = this.comp;
        var cms = this.comp.cms;
        if (side === 'red')
        {
            checkArray = ['bju', 'bma', 'bpao', 'bzhu', 'bjiang'];
            target = { x:cms['rshuai'][0].x, y:cms['rshuai'][0].y}; 
        }
        else
        {
            checkArray = ['rju', 'rma', 'rpao', 'rbing', 'rshuai'];
            target = { x:cms['bjiang'][0].x, y:cms['bjiang'][0].y};
        }
        
        for (var i in checkArray)
        {
            for (var j in cms[checkArray[i]])
            {
                var c = cms[checkArray[i]][j];
                if (c.alive)
                {
                    if (this.isMoveable(c, target.x, target.y))
                    {
                        return true;
                    }
                }
            }
        }

        return false;
    }

}
